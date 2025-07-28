// rollup.config.mjs
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';

export default [
  /**
   * 1) RUNTIME (no acorn inside!)
   */
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.mjs', format: 'esm' },
      // { file: 'dist/index.cjs', format: 'cjs', exports: 'named' },
    ],
    // nothing parser-ish should be reachable from here, so we don't even need to mark acorn external
    plugins: [
      del({ targets: 'dist/*' }),
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser(),
      visualizer({
        filename: 'stats-runtime.html',
        title: 'Runtime Bundle Stats',
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    treeshake: { moduleSideEffects: false },
  },

  /**
   * 2) Vite plugin (still tiny, no acorn either)
   */
  {
    input: 'src/plugin/index.ts',
    output: {
      file: 'dist/vite.mjs',
      format: 'esm',
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser(),
      visualizer({
        filename: 'stats-vite.html',
        title: 'Vite Plugin Bundle Stats',
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    treeshake: { moduleSideEffects: false },
  },

  /**
   * 3) Extractor (Node-only, we BUNDLE acorn here so consumers don't install anything)
   */
  {
    input: 'src/extractor/index.ts',
    output: { file: 'dist/extractor.mjs', format: 'esm', sourcemap: false },
    // DO NOT mark acorn-loose/jsx as external here -> bundle them!
    external: ['fs', 'path'], // keep node core & chalk external
    plugins: [
      resolve({ preferBuiltins: true }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser(),
      visualizer({
        filename: 'stats-extractor.html',
        title: 'Extractor Bundle Stats',
        gzipSize: true,
        brotliSize: true,
      }),
    ],
  },

  /**
   * 4) DTS (runtime)
   */
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.d.ts', format: 'es' },
    plugins: [dts()],
  },

  /**
   * 5) DTS (vite plugin)
   */
  {
    input: 'src/plugin/index.ts',
    output: { file: 'dist/vite.d.ts', format: 'es' },
    plugins: [dts()],
  },

  /**
   * 6) DTS (extractor)
   */
  {
    input: 'src/extractor/index.ts',
    output: { file: 'dist/extractor.d.ts', format: 'es' },
    plugins: [dts()],
  },
];
