import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import dts from "rollup-plugin-dts";
import del from "rollup-plugin-delete";

const inputMap = {
  index: "src/index.ts",
  "tw-safelist": "src/tw-safelist.ts",
  node: "src/node/index.ts",
};

export default [
  // JS Build
  {
    input: inputMap,
    output: {
      dir: "dist",
      format: "esm",
      sourcemap: false,
      entryFileNames: "[name].js", // ensures node.ts -> node.js (not index2.js)
    },
    external: [], // mark dependencies like 'fs', 'url' if needed
    plugins: [del({ targets: "dist" }), resolve(), commonjs(), typescript({ tsconfig: "./tsconfig.json" })],
  },

  // Type Declarations
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
