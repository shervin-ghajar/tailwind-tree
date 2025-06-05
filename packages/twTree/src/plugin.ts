// plugins/vite-plugin-twtree.ts

import type { Plugin } from "vite";
import { writeTwSafelist } from "./utils/writeTwSafelist";

export function twTreePlugin(): Plugin {
  return {
    name: "vite-plugin-twtree",

    // Called in dev mode on each file change or rebuild
    handleHotUpdate() {
      writeTwSafelist();
    },

    // Called once during build
    buildStart() {
      writeTwSafelist();
    },

    // Optionally, run at end of build too
    closeBundle() {
      writeTwSafelist();
    },
  };
}
