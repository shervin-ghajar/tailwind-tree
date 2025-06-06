import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import dts from "rollup-plugin-dts";
import del from "rollup-plugin-delete";

export default [
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
    external: [],
    plugins: [del({ targets: "dist/*" }), resolve(), commonjs(), typescript({ tsconfig: "./tsconfig.json" })],
  },
  {
    input: {
      "tw-safelist": "src/tw-safelist.ts",
      node: "src/node/index.ts",
    },
    output: {
      dir: "dist",
      format: "esm",
      sourcemap: false,
      entryFileNames: "[name].js",
    },
    external: [],
    plugins: [resolve(), commonjs(), typescript({ tsconfig: "./tsconfig.json" })],
  },
  {
    input: "src/index.ts",
    output: { file: "dist/index.d.ts", format: "es" },
    plugins: [dts()],
  },
  {
    input: "src/tw-safelist.ts",
    output: { file: "dist/tw-safelist.d.ts", format: "es" },
    plugins: [dts()],
  },
  {
    input: "src/node/index.ts",
    output: { file: "dist/node.d.ts", format: "es" },
    plugins: [dts()],
  },
];
