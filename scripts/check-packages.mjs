import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'tailwind-tree-packages-'));
const modules = path.join(temporary, 'node_modules');
fs.mkdirSync(modules);
function run(command, args, cwd = temporary) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: path.join(temporary, '.npm-cache') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}
function link(name, source) {
  const target = path.join(modules, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.symlinkSync(source, target, 'dir');
}

try {
  for (const directory of ['tailwind-tree', 'extractor', 'plugin']) {
    const cwd = path.join(root, 'packages', directory);
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    const [packed] = JSON.parse(
      run('npm', ['pack', '--ignore-scripts', '--pack-destination', temporary, '--json'], cwd),
    );
    const destination = path.join(modules, pkg.name);
    fs.mkdirSync(destination, { recursive: true });
    run('tar', [
      '-xzf',
      path.join(temporary, packed.filename),
      '--strip-components=1',
      '-C',
      destination,
    ]);
    const targets = (value) =>
      typeof value === 'string' ? [value] : Object.values(value).flatMap(targets);
    for (const value of Object.values(pkg.exports)) {
      for (const target of targets(value))
        assert.ok(fs.existsSync(path.join(destination, target)), `${pkg.name}: missing ${target}`);
    }
    for (const file of fs
      .readdirSync(path.join(destination, 'dist'))
      .filter((file) => file.endsWith('.mjs'))) {
      const code = fs.readFileSync(path.join(destination, 'dist', file), 'utf8');
      for (const [, id] of code.matchAll(/\bfrom\s*["']([^"']+)["']/g)) {
        if (id.startsWith('.') || id.startsWith('node:')) continue;
        const dependency = id
          .split('/')
          .slice(0, id.startsWith('@') ? 2 : 1)
          .join('/');
        assert.ok(
          pkg.dependencies?.[dependency] || pkg.peerDependencies?.[dependency],
          `${pkg.name}: undeclared dependency ${dependency}`,
        );
      }
    }
  }
  link('@babel', path.join(root, 'packages/shared/node_modules/@babel'));
  link('vite', fs.realpathSync(path.join(root, 'node_modules/vite')));
  link('@types/node', fs.realpathSync(path.join(root, 'node_modules/@types/node')));

  // The core entry must load without a merger peer or any source checkout imports.
  fs.writeFileSync(
    path.join(temporary, 'core.mjs'),
    `import assert from 'node:assert/strict'; import {twTree} from 'tailwind-tree/core'; assert.equal(twTree([['p-2','p-4']]), 'p-2 p-4');`,
  );
  run('node', ['core.mjs']);

  for (const [version, merger] of [
    [3, 'tailwind-merge-v3'],
    [4, 'tailwind-merge'],
  ]) {
    link('tailwind-merge', fs.realpathSync(path.join(root, 'node_modules', merger)));
    const program = `
      import assert from 'node:assert/strict';
      import {twTree} from 'tailwind-tree';
      import {extractTwTree, transformTwTree} from '@tailwind-tree/extractor';
      import {twTreePlugin} from '@tailwind-tree/vite-plugin';
      assert.equal(twTree([['p-2','p-4']], {}), 'p-4');
      assert.equal(twTree([{hover:'p-2 p-4'}], {version:${version},prefix:'${version === 3 ? 'tw-' : 'tw'}'}), '${version === 3 ? 'hover:tw-p-4' : 'tw:hover:p-4'}');
      assert.deepEqual(extractTwTree('twTree([{md:{hover:"underline"}}])'), ['md:hover:underline']);
      assert.ok(transformTwTree('twTree(["p-4"])').includes('p-4'));
      assert.equal(twTreePlugin().name, 'vite-plugin-tailwind-tree');
    `;
    fs.writeFileSync(path.join(temporary, 'consumer.mjs'), program);
    run('node', ['consumer.mjs']);
    const cjs = program
      .replace(
        /import assert from 'node:assert\/strict';/,
        `const assert = require('node:assert/strict');`,
      )
      .replace(/import \{([^}]+)\} from '([^']+)';/g, "const {$1} = require('$2');");
    fs.writeFileSync(path.join(temporary, 'consumer.cjs'), cjs);
    run('node', ['consumer.cjs']);
    fs.unlinkSync(path.join(modules, 'tailwind-merge'));
  }

  link('tailwind-merge', fs.realpathSync(path.join(root, 'node_modules/tailwind-merge')));
  fs.writeFileSync(
    path.join(temporary, 'consumer.mts'),
    `
    import {twTree, type TreeValue, type TreeVariants} from 'tailwind-tree';
    import {twTree as core} from 'tailwind-tree/core';
    import {extractTwTree, transformTwTree} from '@tailwind-tree/extractor';
    import {twTreePlugin} from '@tailwind-tree/vite-plugin';
    const input: readonly TreeValue[] = ['p-4', false, {hover:['underline']}];
    const result: string = twTree(input, {version:4,prefix:'tw'});
    const variants = {hover:'p-4', md:{focus:'underline'}, 'custom-breakpoint':'block'} satisfies TreeVariants;
    twTree([variants]);
    core(input); extractTwTree(result); transformTwTree(result); twTreePlugin({sources:['src']});
  `,
  );
  run(process.execPath, [
    path.join(root, 'node_modules/typescript/bin/tsc'),
    '--noEmit',
    '--skipLibCheck',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    '--target',
    'ES2022',
    'consumer.mts',
  ]);
  fs.copyFileSync(path.join(temporary, 'consumer.mts'), path.join(temporary, 'consumer.cts'));
  run(process.execPath, [
    path.join(root, 'node_modules/typescript/bin/tsc'),
    '--noEmit',
    '--strict',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    '--target',
    'ES2022',
    'consumer.mts',
    'consumer.cts',
  ]);
  for (const entry of ['tailwind-tree', 'tailwind-tree/core']) {
    const marked = `import {twTree} from '${entry}'; twTree([{md:{ /*cursor*/ }}]);`;
    const position = marked.indexOf('/*cursor*/');
    const file = path.join(temporary, 'completions.mts');
    fs.writeFileSync(file, marked.replace('/*cursor*/', ''));
    const options = {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      strict: true,
      types: [],
    };
    const service = ts.createLanguageService({
      ...ts.createCompilerHost(options),
      getCompilationSettings: () => options,
      getScriptFileNames: () => [file],
      getScriptVersion: () => '0',
      getCurrentDirectory: () => temporary,
      getScriptSnapshot(file) {
        const content = ts.sys.readFile(file);
        return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content);
      },
    });
    try {
      const names =
        service.getCompletionsAtPosition(file, position, {})?.entries.map((entry) => entry.name) ??
        [];
      assert.ok(
        ['hover', 'md', 'focus', 'lg'].every((name) => names.includes(name)),
        `${entry}: missing variant key completions in packed declarations`,
      );
    } finally {
      service.dispose();
    }
  }
  link('@tailwindcss/vite', fs.realpathSync(path.join(root, 'node_modules/@tailwindcss/vite')));
  link('tailwindcss', fs.realpathSync(path.join(root, 'node_modules/tailwindcss')));
  const fixture = path.join(temporary, 'app');
  fs.mkdirSync(path.join(fixture, 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(fixture, 'index.html'),
    '<script type="module" src="/src/main.js"></script>',
  );
  fs.writeFileSync(path.join(fixture, 'src/main.js'), 'import "./style.css";');
  fs.writeFileSync(path.join(fixture, 'src/style.css'), '@import "tailwindcss";');
  fs.writeFileSync(path.join(fixture, 'src/tree.ts'), 'twTree([{md:{hover:"underline"}}]);');
  fs.writeFileSync(
    path.join(temporary, 'build.mjs'),
    `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import path from 'node:path';
    import {build} from 'vite';
    import tailwindcss from '@tailwindcss/vite';
    import {twTreePlugin} from '@tailwind-tree/vite-plugin';
    await build({root:${JSON.stringify(fixture)},configFile:false,logLevel:'silent',plugins:[twTreePlugin(),tailwindcss()]});
    const directory = ${JSON.stringify(path.join(fixture, 'dist/assets'))};
    const css = fs.readdirSync(directory).filter(file => file.endsWith('.css')).map(file => fs.readFileSync(path.join(directory,file),'utf8')).join('');
    assert.ok(css.includes('.md' + String.fromCharCode(92) + ':hover' + String.fromCharCode(92) + ':underline'));
  `,
  );
  for (const vite of ['vite', 'vite-v7', 'vite-v8']) {
    fs.unlinkSync(path.join(modules, 'vite'));
    link('vite', fs.realpathSync(path.join(root, 'node_modules', vite)));
    run('node', ['build.mjs']);
  }
  console.log(
    'Packed packages: ESM, CommonJS, declarations and variant completions, all exports, merger v2/v3, peer-free core, and Vite 6/7/8 builds passed.',
  );
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
