import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import dts from "rollup-plugin-dts";
import del from "rollup-plugin-delete";

export default [
  // 1. Main library bundle (index.ts)
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.mjs",
        format: "esm",
        sourcemap: false,
      },
      {
        file: "dist/index.cjs",
        format: "cjs",
        sourcemap: false,
        exports: "named",
      },
    ],
    // Prevent bundling getTwSafelist here; it stays separate
    plugins: [
      del({ targets: "dist/*" }), // clean dist on first build only
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
    ],
  },

  // 2. Separate build for tw-safelist and node/index.ts (multi-entry)
  {
    input: {
      node: "src/node/index.ts",
    },
    output: {
      dir: "dist",
      format: "esm",
      sourcemap: false,
      entryFileNames: "[name].js",
    },
    external: ["./tw-safelist"], // mark tw-safelist external here too if needed
    plugins: [resolve(), commonjs(), typescript({ tsconfig: "./tsconfig.json" })],
  },

  // 3. Type declarations for main index.ts + tw-safelist + node + getTwSafelist
  {
    input: "src/index.ts",
    output: { file: "dist/index.d.ts", format: "es" },
    plugins: [dts()],
  },
  {
    input: "src/node/index.ts",
    output: { file: "dist/node.d.ts", format: "es" },
    plugins: [dts()],
  },
];
