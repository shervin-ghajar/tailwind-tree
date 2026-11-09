import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import postcss from 'postcss';
import tailwindV3 from 'tailwindcss-v3';
import tailwindV30 from 'tailwindcss-v3-0';
import { compile as compile43 } from 'tailwindcss-v4';
import { compile as compile40 } from 'tailwindcss-v4-0';
import { compile as compile41 } from 'tailwindcss-v4-1';
import { describe, expect, it } from 'vitest';
import { extractTwTree, transformTwTree } from '../packages/extractor/src';

const require = createRequire(import.meta.url);
const { Scanner } = createRequire(require.resolve('@tailwindcss/vite'))('@tailwindcss/oxide');
const source = `import {twTree} from 'tailwind-tree';
const classes = twTree([
  'p-2.5 w-1/2',
  { md: { hover: ['underline', active ? 'bg-red-500' : 'bg-blue-500'] } },
  { '[&>span]': 'opacity-50' },
]);
const ordinary = '<div class="text-center">';`;
const escapeClass = (candidate: string) => '.' + candidate.replace(/([^\w-])/g, '\\$1');

for (const [name, tailwind] of [
  ['3.0.24', tailwindV30],
  ['3.4.17', tailwindV3],
] as const) {
  describe(`Tailwind ${name}`, () => {
    it('compiles transformed multiline trees and retains normal class detection', async () => {
      const result = await postcss([
        tailwind({
          content: {
            files: [{ raw: source, extension: 'tsx' }],
            transform: { tsx: transformTwTree },
          },
          corePlugins: { preflight: false },
        }),
      ]).process('@tailwind utilities;', { from: undefined });
      for (const candidate of [
        'p-2.5',
        'w-1/2',
        'md:hover:underline',
        'md:hover:bg-red-500',
        'md:hover:bg-blue-500',
        'text-center',
      ])
        expect(result.css).toContain(escapeClass(candidate));
      // Arbitrary variants were introduced after v3.0.
      if (name === '3.4.17') expect(result.css).toContain(escapeClass('[&>span]:opacity-50'));
      expect(result.css).not.toMatch(/\.underline\s*\{/);
      expect(result.css).not.toMatch(/\.bg-red-500\s*\{/);
    });

    it('compiles prefixed important and negative utilities', async () => {
      const code = `twTree([{hover:'!p-4 -mt-2'}], {prefix:'tw-', version:3})`;
      const result = await postcss([
        tailwind({
          prefix: 'tw-',
          content: { files: [{ raw: code, extension: 'ts' }], transform: { ts: transformTwTree } },
          corePlugins: { preflight: false },
        }),
      ]).process('@tailwind utilities;', { from: undefined });
      for (const candidate of extractTwTree(code))
        expect(result.css).toContain(escapeClass(candidate));
    });
  });
}

for (const [name, alias, compile] of [
  ['4.0.17', 'tailwindcss-v4-0', compile40],
  ['4.1.17', 'tailwindcss-v4-1', compile41],
  ['4.3.5', 'tailwindcss-v4', compile43],
] as const) {
  describe(`Tailwind ${name}`, () => {
    async function compiler(prefix = false, clean = false) {
      return compile(
        `@import "tailwindcss"${prefix ? ' prefix(tw)' : ''}${clean ? ' source(none)' : ''};\n@source "./.tailwind-tree/candidates.txt";`,
        {
          base: process.cwd(),
          async loadStylesheet(id, base) {
            const file =
              id === 'tailwindcss' ? require.resolve(`${alias}/index.css`) : path.resolve(base, id);
            return { path: file, base: path.dirname(file), content: fs.readFileSync(file, 'utf8') };
          },
        },
      );
    }

    it('registers the candidate source and emits actual CSS for the collected classes', async () => {
      const result = await compiler();
      const sources = 'sources' in result ? result.sources : result.globs;
      expect(sources.some((source) => source.pattern.endsWith('candidates.txt'))).toBe(true);
      const css = result.build(extractTwTree(source));
      for (const candidate of extractTwTree(source)) expect(css).toContain(escapeClass(candidate));
    });

    it('compiles v4 prefixes, variable shorthand, and important modifiers', async () => {
      const code = `twTree([{ hover: 'flex! bg-(--brand)' }], {prefix:'tw', version:4})`;
      const result = await compiler(true);
      const css = result.build(extractTwTree(code));
      for (const candidate of extractTwTree(code)) expect(css).toContain(escapeClass(candidate));
      expect(css).toContain('!important');
    });

    it('supports explicit scanning without redundant unqualified tree leaves', async () => {
      const result = await compiler(false, true);
      expect(result.root).toBe('none');
      const scanner = new Scanner({});
      const css = result.build(
        scanner.scanFiles([{ content: transformTwTree(source), extension: 'txt' }]),
      );
      for (const candidate of [...extractTwTree(source), 'text-center'])
        expect(css).toContain(escapeClass(candidate));
      for (const leaf of ['underline', 'bg-red-500', 'bg-blue-500', 'opacity-50'])
        expect(css).not.toMatch(new RegExp(`\\.${leaf}\\s*\\{`));
    });
  });
}
