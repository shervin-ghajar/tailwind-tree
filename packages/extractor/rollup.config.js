// rollup.config.mjs
import pluginAlias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import strip from '@rollup/plugin-strip';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import path from 'path';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';

const alias = pluginAlias({
  entries: [
    {
      find: /^@tailwind-tree\/shared\/(.*)$/,
      replacement: (_, p1) => path.resolve(`../shared/src/${p1}.ts`),
    },
  ],
});

export default [
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.mjs', format: 'esm' },
      { file: 'dist/index.cjs', format: 'commonjs' },
    ],
    // nothing parser-ish should be reachable from here, so we don't even need to mark acorn external
    plugins: [
      del({ targets: 'dist/*' }),
      alias,
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json', include: ['**/*.ts', '**/*.tsx'] }),
      strip({
        include: ['**/*.js', '**/*.ts'],
      }),
      terser(),
    ],
    treeshake: { moduleSideEffects: false },
  },
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.d.ts', format: 'es' },
    plugins: [dts(), alias],
  },
];
