import { describe, expect, it } from 'vitest';
import { extractTwTree, transformTwTree } from '../packages/extractor/src';

const tree = (expression: string) =>
  `import { twTree } from 'tailwind-tree'; twTree(${expression});`;

describe('full-file extraction', () => {
  it('preserves multiline variants and both conditional branches', () => {
    expect(
      extractTwTree(
        tree(`[
      'p-2.5',
      { md: {
        hover: [enabled ? 'bg-red-500 p-4' : 'bg-blue-500', { focus: 'underline' }]
      }}
    ]`),
      ),
    ).toEqual([
      'md:hover:bg-blue-500',
      'md:hover:bg-red-500',
      'md:hover:focus:underline',
      'md:hover:p-4',
      'p-2.5',
    ]);
  });

  it('resolves aliases, local constants, spreads, computed constant keys, and TS wrappers', () => {
    const source = `
      import { twTree as tree } from 'tailwind-tree';
      const state = 'hover';
      const base = ['p-4'] as const;
      const variants = { [state]: 'underline' } as const;
      const input = [...base, { ...variants, md: { focus: 'ring-2' } }] satisfies unknown[];
      const options = { prefix: 'tw', version: 4 } as const;
      tree(input, options);
    `;
    expect(extractTwTree(source)).toEqual(['tw:hover:underline', 'tw:md:focus:ring-2', 'tw:p-4']);
  });

  it('uses lexical scope and ignores unrelated imports and shadowed functions', () => {
    expect(
      extractTwTree(`
      import { twTree } from 'tailwind-tree';
      twTree([{ hover: 'underline' }]);
      function local(twTree) { twTree([{ hover: 'hidden' }]); }
      { const twTree = other; twTree([{ focus: 'block' }]); }
    `),
    ).toEqual(['hover:underline']);
    expect(extractTwTree(`import { twTree } from 'other'; twTree(['hidden']);`)).toEqual([]);
  });

  it('recognizes namespace imports and the dependency-free entrypoint', () => {
    expect(
      extractTwTree(
        `import * as tree from 'tailwind-tree/core'; tree.twTree([{ hover: 'underline' }]);`,
      ),
    ).toEqual(['hover:underline']);
  });

  it('tokenizes strings and templates identically and ignores empty values', () => {
    expect(
      extractTwTree(tree('[null, false, undefined, [], {hover: `p-4 underline`}, {focus: "   "}]')),
    ).toEqual(['hover:p-4', 'hover:underline']);
  });

  it('preserves arbitrary variants, important modifiers, negative values, and modern syntax', () => {
    expect(
      extractTwTree(tree(`[{ '[&>div:nth-child(odd)]': 'bg-(--brand) flex! -mt-2 w-1/2' }]`)),
    ).toEqual([
      '[&>div:nth-child(odd)]:-mt-2',
      '[&>div:nth-child(odd)]:bg-(--brand)',
      '[&>div:nth-child(odd)]:flex!',
      '[&>div:nth-child(odd)]:w-1/2',
    ]);
  });

  it('uses the same v3 prefix rules as the runtime', () => {
    expect(
      extractTwTree(tree(`[{hover:'!p-4 -mt-2'}, 'focus:p-2'], {prefix:'tw-', version:3}`)),
    ).toEqual(['focus:tw-p-2', 'hover:!tw-p-4', 'hover:-tw-mt-2']);
  });

  it('handles conditional object spreads and logical gates', () => {
    expect(
      extractTwTree(
        tree(`[{...(active ? {hover:'p-2'} : {focus:'p-4'})}, enabled && 'underline']`),
      ),
    ).toEqual(['focus:p-4', 'hover:p-2', 'underline']);
  });

  it.each([
    ['[styles]', 'Cannot statically resolve'],
    ['[`p-${size}`]', 'Interpolated templates'],
    ['[{[state]:"p-4"}]', 'Cannot statically resolve'],
    ['[makeClasses()]', 'Unsupported tree expression'],
    ['input', 'Circular tree'],
  ])('reports unsupported expressions instead of silently dropping CSS: %s', (input, message) => {
    const prelude = input === 'input' ? 'const input = [input];' : '';
    expect(() => extractTwTree(prelude + tree(input), 'button.tsx')).toThrow(message);
    expect(() => extractTwTree(prelude + tree(input), 'button.tsx')).toThrow('button.tsx');
  });

  it('reports malformed source with its filename', () => {
    expect(() => extractTwTree('twTree([', 'broken.ts')).toThrow('broken.ts');
  });

  it('retains ordinary classes while replacing tree inputs for Tailwind scanning', () => {
    const source = `const html = '<div class="p-2.5 w-1/2">';\n${tree('[{md:{hover:"underline"}}]')}`;
    expect(transformTwTree(source)).toContain('<div class="p-2.5 w-1/2">');
    expect(transformTwTree(source)).not.toContain('hover:"underline"');
    expect(transformTwTree(source)).toContain('md:hover:underline');
    expect(extractTwTree('export const unrelated = true')).toEqual([]);
  });

  it('removes tree-only constants through spreads, wrappers, aliases, and shared dependencies', () => {
    const source = `
      import {twTree as tree} from 'tailwind-tree';
      const leaf = 'underline';
      const variants = {hover: leaf} as const;
      const input = [{...variants, md: {focus: 'italic'}}];
      tree(input);
    `;
    const transformed = transformTwTree(source);
    expect(transformed).toContain('hover:underline md:focus:italic');
    expect(transformed).not.toContain("'underline'");
    expect(transformed).not.toContain("'italic'");
  });

  it('preserves constants reused outside trees and exported values', () => {
    const source = `
      const leaf = 'underline';
      const shared = [leaf];
      const local = [shared];
      export const publicStyles = 'italic';
      twTree([{hover: local, focus: publicStyles}]);
      render(shared);
    `;
    const transformed = transformTwTree(source);
    expect(transformed).toContain("const leaf = 'underline'");
    expect(transformed).toContain('const shared = [leaf]');
    expect(transformed).toContain("export const publicStyles = 'italic'");
    expect(transformed).toContain('focus:italic hover:underline');
  });

  it('preserves opted-out trees and unrelated or shadowed functions', () => {
    const source = `
      twTree([{hover: 'italic'}], {extract:false});
      function component(twTree) { twTree([{focus:'underline'}]); }
    `;
    expect(transformTwTree(source)).toContain(source);
  });

  it('preserves ordinary classes and constant dependencies inside runtime conditions', () => {
    const source = `
      const gateStyles = 'text-center';
      const input = [render(<div className={gateStyles} />) && 'underline'];
      twTree([{hover: input, focus: render(<p className="italic" />) ? 'block' : 'hidden'}]);
    `;
    const transformed = transformTwTree(source);
    expect(transformed).toContain("const gateStyles = 'text-center'");
    expect(transformed).toContain('render(<div className={gateStyles} />)');
    expect(transformed).toContain('render(<p className="italic" />)');
    expect(transformed).toContain('focus:block focus:hidden hover:underline');
    expect(transformed).not.toContain("'underline'");
  });
});

it('allows explicit sources to own dynamic trees through extract: false', () => {
  expect(extractTwTree('twTree([`p-${size}`], {prefix: runtimePrefix, extract:false})')).toEqual(
    [],
  );
  expect(extractTwTree('twTree(["p-4"], undefined)')).toEqual(['p-4']);
});

it('honors option spread precedence, ignores custom merger implementations, and detects cycles', () => {
  expect(
    extractTwTree(
      'twTree(["p-4"], {extract:false, ...{extract:true}, merge(value) { return value; }})',
    ),
  ).toEqual(['p-4']);
  expect(extractTwTree('twTree([unknown], {...{extract:true}, extract:false})')).toEqual([]);
  expect(() => extractTwTree('const options = {...options}; twTree(["p-4"], options)')).toThrow(
    'Circular options',
  );
});

it('parses TypeScript assertions and generic arrows when given a .ts filename', () => {
  expect(
    extractTwTree('const identity = <T>(value: T) => value; twTree(<const>["p-4"]);', 'source.ts'),
  ).toEqual(['p-4']);
});

it.each([
  `const {twTree: tree} = require('tailwind-tree'); tree([{hover:'underline'}]);`,
  `const styles = require('tailwind-tree/core'); styles.twTree([{hover:'underline'}]);`,
  `const tree = require('tailwind-tree').twTree; tree([{hover:'underline'}]);`,
])('recognizes CommonJS bindings without executing require', (source) => {
  expect(extractTwTree(source, 'source.cjs')).toEqual(['hover:underline']);
});

it('does not confuse shadowed undefined or destructured bindings with literal trees', () => {
  expect(
    extractTwTree('function component() { const undefined = "p-4"; twTree([undefined]); }'),
  ).toEqual(['p-4']);
  expect(() => extractTwTree('const {style} = {style:"p-4"}; twTree([style])')).toThrow(
    'Cannot statically resolve',
  );
});
