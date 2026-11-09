import type { NodePath } from '@babel/traverse';
import type { TreeOptions } from './twTree';
import { prefixClass } from './twTree';

function fail(path: NodePath, message: string): never {
  const line = path.node.loc?.start.line ?? '?';
  throw new Error(
    `tailwind-tree: ${message} at line ${line}. Use finite local constants or literal trees; runtime interpolation and imported values need explicit Tailwind sources.`,
  );
}

export function resolveConstant(path: NodePath, seen = new Set<object>()): NodePath {
  if (seen.has(path.node)) return fail(path, 'Circular constant');
  seen.add(path.node);
  if (
    path.isTSAsExpression() ||
    path.isTSSatisfiesExpression() ||
    path.isTSTypeAssertion() ||
    path.isTSNonNullExpression() ||
    path.isParenthesizedExpression()
  ) {
    return resolveConstant(path.get('expression') as NodePath, seen);
  }
  if (path.isIdentifier()) {
    const binding = path.scope.getBinding(path.node.name);
    if (path.node.name === 'undefined' && !binding) return path;
    if (
      binding?.kind !== 'const' ||
      !binding.constant ||
      !binding.path.isVariableDeclarator() ||
      !binding.path.get('id').isIdentifier()
    ) {
      return fail(path, `Cannot statically resolve ${path.node.name}`);
    }
    const init = binding.path.get('init');
    if (!init.node) return fail(path, `Missing value for ${path.node.name}`);
    return resolveConstant(init as NodePath, seen);
  }
  return path;
}

function propertyKey(path: NodePath): string {
  if (!path.isObjectProperty() && !path.isObjectMethod())
    return fail(path, 'Unsupported object member');
  const key = path.get('key') as NodePath;
  if (!path.node.computed && key.isIdentifier()) return key.node.name;
  const resolved = resolveConstant(key);
  if (resolved.isStringLiteral()) return resolved.node.value;
  return fail(path, 'Variant keys must be static strings');
}

function optionProperties(path: NodePath, seen = new Set<object>()): Map<string, NodePath> {
  const value = resolveConstant(path);
  if (value.isIdentifier({ name: 'undefined' })) return new Map();
  if (!value.isObjectExpression()) return fail(path, 'Options must be a static object');
  if (seen.has(value.node)) return fail(value, 'Circular options');
  seen.add(value.node);
  const properties = new Map<string, NodePath>();
  try {
    for (const property of value.get('properties')) {
      if (property.isSpreadElement()) {
        for (const [key, member] of optionProperties(property.get('argument') as NodePath, seen))
          properties.set(key, member);
      } else properties.set(propertyKey(property), property);
    }
    return properties;
  } finally {
    seen.delete(value.node);
  }
}

export function extractOptions(path?: NodePath): TreeOptions {
  if (!path?.node) return {};
  const properties = optionProperties(path);
  const extraction = properties.get('extract');
  if (extraction) {
    const flag = resolveConstant(extraction.get('value') as NodePath);
    if (!flag.isBooleanLiteral()) return fail(flag, 'extract must be a static boolean');
    if (!flag.node.value) return { extract: false };
  }
  const options: TreeOptions = {};
  for (const key of ['prefix', 'version'] as const) {
    const property = properties.get(key);
    if (!property) continue;
    const option = resolveConstant(property.get('value') as NodePath);
    if (key === 'prefix' && option.isStringLiteral()) options.prefix = option.node.value;
    else if (
      key === 'version' &&
      option.isNumericLiteral() &&
      (option.node.value === 3 || option.node.value === 4)
    )
      options.version = option.node.value;
    else fail(option, `Invalid static ${key} option`);
  }
  return options;
}

export function extractClassesFromNode(
  path: NodePath,
  options: TreeOptions = {},
  variants = '',
  seen = new Set<object>(),
): string[] {
  if (!path.node) return [];
  const value = resolveConstant(path);
  if (seen.has(value.node)) return fail(value, 'Circular tree');
  seen.add(value.node);
  try {
    if (value.isStringLiteral()) {
      return value.node.value
        .split(/\s+/)
        .filter(Boolean)
        .map((token) => prefixClass(token, variants, options));
    }
    if (value.isTemplateLiteral()) {
      if (value.node.expressions.length)
        return fail(value, 'Interpolated templates cannot be extracted');
      return value.node.quasis
        .map((part) => part.value.cooked ?? part.value.raw)
        .join('')
        .split(/\s+/)
        .filter(Boolean)
        .map((token) => prefixClass(token, variants, options));
    }
    if (value.isArrayExpression()) {
      return value
        .get('elements')
        .flatMap((element) => extractClassesFromNode(element as NodePath, options, variants, seen));
    }
    if (value.isObjectExpression()) {
      return value.get('properties').flatMap((property) => {
        if (property.isSpreadElement())
          return extractClassesFromNode(
            property.get('argument') as NodePath,
            options,
            variants,
            seen,
          );
        if (!property.isObjectProperty()) return fail(property, 'Tree methods are not supported');
        const key = propertyKey(property);
        return extractClassesFromNode(
          (property as NodePath).get('value') as NodePath,
          options,
          `${variants}${key}:`,
          seen,
        );
      });
    }
    if (value.isSpreadElement())
      return extractClassesFromNode(value.get('argument') as NodePath, options, variants, seen);
    if (value.isConditionalExpression()) {
      return ['consequent', 'alternate'].flatMap((key) =>
        extractClassesFromNode(value.get(key) as NodePath, options, variants, seen),
      );
    }
    if (value.isLogicalExpression()) {
      const right = extractClassesFromNode(value.get('right') as NodePath, options, variants, seen);
      return value.node.operator === '&&'
        ? right
        : [
            ...extractClassesFromNode(value.get('left') as NodePath, options, variants, seen),
            ...right,
          ];
    }
    if (
      value.isNullLiteral() ||
      value.isBooleanLiteral() ||
      value.isIdentifier({ name: 'undefined' })
    )
      return [];
    return fail(value, `Unsupported tree expression ${value.type}`);
  } finally {
    seen.delete(value.node);
  }
}
