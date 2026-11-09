import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import fs from 'node:fs';
import path from 'node:path';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';

/** Shared build policy; private shared sources are bundled, public dependencies stay external. */
export function packageConfig(entries = { index: 'src/index.ts' }) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies });
  const external = (id) =>
    id.startsWith('node:') || dependencies.some((name) => id === name || id.startsWith(`${name}/`));
  return [
    {
      input: entries,
      external,
      output: [
        { dir: 'dist', format: 'esm', entryFileNames: '[name].mjs' },
        { dir: 'dist', format: 'cjs', entryFileNames: '[name].cjs' },
      ],
      plugins: [
        del({ targets: 'dist/*' }),
        resolve(),
        typescript({
          tsconfig: './tsconfig.json',
          include: ['**/*.ts'],
          filterRoot: path.resolve('../..'),
          noEmitOnError: true,
        }),
        terser(),
      ],
    },
    ...Object.entries(entries).map(([name, input]) => ({
      input,
      external,
      output: [
        { file: `dist/${name}.d.ts`, format: 'es' },
        { file: `dist/${name}.d.cts`, format: 'es' },
      ],
      plugins: [dts()],
    })),
  ];
}
