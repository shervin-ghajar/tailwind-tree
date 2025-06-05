import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import dts from "rollup-plugin-dts";
import del from "rollup-plugin-delete";

const input = "src/index.ts";
const safelistInput = "src/tw-safelist.ts";

export default [
  // 1. Main bundle
  {
    input: [input, safelistInput],
    output: [
      {
        dir: "dist",
        format: "esm",
        sourcemap: false,
        entryFileNames: "[name].js",
      },
    ],
    external: [], // Add externals if needed
    plugins: [del({ targets: "dist" }), resolve(), commonjs(), typescript({ tsconfig: "./tsconfig.json" })],
  },

  // 2. Type declarations
  {
    input,
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
  {
    input: safelistInput,
    output: {
      file: "dist/tw-safelist.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
];
