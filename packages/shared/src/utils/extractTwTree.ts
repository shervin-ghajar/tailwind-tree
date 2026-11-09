import traverseModule, { type Binding, type NodePath } from '@babel/traverse';
import { extractClassesFromNode, extractOptions } from './extractClassesFromNode';
import { parseProgram } from './parser';

// Babel's CJS export is wrapped when loaded by native ESM.
const traverse =
  typeof traverseModule === 'function'
    ? traverseModule
    : (traverseModule as unknown as { default: typeof traverseModule }).default;
const modules = new Set(['tailwind-tree', 'tailwind-tree/core']);

function isRequire(path: NodePath): boolean {
  if (
    !path.isCallExpression() ||
    !path.get('callee').isIdentifier({ name: 'require' }) ||
    path.scope.getBinding('require')
  )
    return false;
  const source = path.get('arguments')[0];
  return !!source?.isStringLiteral() && modules.has(source.node.value);
}

function isTreeBinding(path: NodePath, localName: string, namespace: boolean): boolean {
  const binding = path.scope.getBinding(localName);
  if (!binding) return !namespace && localName === 'twTree';
  const declaration = binding.path.parentPath;
  if (binding.path.isImportSpecifier()) {
    const imported = binding.path.node.imported;
    return (
      !namespace &&
      (imported.type === 'Identifier' ? imported.name : imported.value) === 'twTree' &&
      declaration !== null &&
      declaration.isImportDeclaration() &&
      modules.has(declaration.node.source.value)
    );
  }
  if (binding.path.isImportNamespaceSpecifier())
    return (
      namespace &&
      declaration !== null &&
      declaration.isImportDeclaration() &&
      modules.has(declaration.node.source.value)
    );
  if (!binding.path.isVariableDeclarator() || !binding.constant) return false;
  const init = binding.path.get('init');
  const id = binding.path.get('id');
  if (namespace) return id.isIdentifier() && isRequire(init as NodePath);
  if (id.isObjectPattern() && isRequire(init as NodePath)) {
    return id
      .get('properties')
      .some(
        (property) =>
          property.isObjectProperty() &&
          property.get('key').isIdentifier({ name: 'twTree' }) &&
          property.get('value').isIdentifier({ name: localName }),
      );
  }
  return (
    id.isIdentifier() &&
    init.isMemberExpression() &&
    !init.node.computed &&
    init.get('property').isIdentifier({ name: 'twTree' }) &&
    isRequire(init.get('object') as NodePath)
  );
}

function isTreeCall(path: NodePath): boolean {
  const callee = path.get('callee') as NodePath;
  if (callee.isIdentifier()) return isTreeBinding(path, callee.node.name, false);
  if (
    callee.isMemberExpression() &&
    !callee.node.computed &&
    callee.get('property').isIdentifier({ name: 'twTree' })
  ) {
    const object = callee.get('object');
    return object.isIdentifier() && isTreeBinding(path, object.node.name, true);
  }
  return false;
}

function scanTwTree(content: string, filePath: string) {
  const candidates = new Set<string>();
  const inputs: NodePath[] = [];
  if (!/\btwTree\b/.test(content)) return { candidates: [], inputs };
  try {
    traverse(parseProgram(content, filePath), {
      CallExpression(path) {
        if (!isTreeCall(path)) return;
        const args = path.get('arguments');
        if (!args[0]?.node) return;
        const options = extractOptions(args[1] as NodePath | undefined);
        if (options.extract === false) return;
        for (const candidate of extractClassesFromNode(args[0] as NodePath, options))
          candidates.add(candidate);
        inputs.push(args[0] as NodePath);
      },
    });
  } catch (error) {
    throw new Error(`${filePath}: ${(error as Error).message}`, { cause: error });
  }
  return { candidates: [...candidates].sort(), inputs };
}

/** Complete JS/TS source only: use transformTwTree with Tailwind v3's content.transform. */
export function extractTwTree(content: string, filePath = 'source.tsx'): string[] {
  return scanTwTree(content, filePath).candidates;
}

/** Scan text only, never executable output: preserve ordinary classes without raw tree leaves. */
export function prepareTwTreeSource(content: string, filePath = 'source.tsx') {
  const { candidates, inputs } = scanTwTree(content, filePath);
  const constants = new Map<Binding, NodePath>();
  const conditions: NodePath[] = [];
  function collect(path: NodePath) {
    function condition(path: NodePath) {
      if (path.isConditionalExpression()) conditions.push(path.get('test') as NodePath);
      if (path.isLogicalExpression({ operator: '&&' }))
        conditions.push(path.get('left') as NodePath);
    }
    function reference(reference: NodePath) {
      if (!reference.isReferencedIdentifier()) return;
      const binding = reference.scope.getBinding(reference.node.name);
      if (
        !binding ||
        binding.kind !== 'const' ||
        !binding.constant ||
        !binding.path.isVariableDeclarator() ||
        !binding.path.get('id').isIdentifier() ||
        binding.path.parentPath?.parentPath?.isExportNamedDeclaration() ||
        constants.has(binding)
      )
        return;
      const init = binding.path.get('init') as NodePath;
      if (!init.node) return;
      constants.set(binding, init);
      collect(init);
    }
    reference(path);
    condition(path);
    path.traverse({
      ReferencedIdentifier: reference,
      ConditionalExpression: condition,
      LogicalExpression: condition,
    });
  }
  inputs.forEach(collect);

  // Keep shared constants, including dependencies of constants used outside a tree.
  let changed = true;
  const contains = (range: NodePath, reference: NodePath) =>
    reference === range || !!reference.findParent((parent) => parent === range);
  while (changed) {
    changed = false;
    const ranges = [...inputs, ...constants.values()];
    for (const [binding] of constants) {
      if (
        binding.referencePaths.some(
          (reference) =>
            conditions.some((condition) => contains(condition, reference)) ||
            !ranges.some((range) => contains(range, reference)),
        )
      ) {
        constants.delete(binding);
        changed = true;
      }
    }
  }

  // These nodes come directly from the parser, which supplies source offsets.
  const ranges = [...inputs, ...constants.values()].sort((a, b) => a.node.start! - b.node.start!);
  let source = '';
  let end = 0;
  for (const range of ranges) {
    const start = Math.max(end, range.node.start!);
    if (range.node.end! <= start) continue;
    source +=
      content.slice(end, start) + content.slice(start, range.node.end!).replace(/[^\r\n]/g, ' ');
    end = range.node.end!;
  }
  const gates = conditions.map((condition) =>
    content.slice(condition.node.start!, condition.node.end!),
  );
  return {
    candidates,
    source: `${source}${content.slice(end)}\n${gates.join('\n')}\n${candidates.join(' ')}\n`,
  };
}

export function transformTwTree(content: string, filePath = 'source.tsx'): string {
  return prepareTwTreeSource(content, filePath).source;
}
