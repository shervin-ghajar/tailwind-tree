import type { Plugin } from "vite";
import { generateTwSafelist } from "./utils/generateTwSafelist";

export function twTreePlugin(): Plugin {
  return {
    name: "vite-plugin-tailwind-tree",

    // Called in dev mode on each file change or rebuild
    handleHotUpdate() {
      generateTwSafelist();
    },

    // Called once during build
    buildStart() {
      generateTwSafelist();
    },

    // Optionally, run at end of build too
    closeBundle() {
      generateTwSafelist();
    },
  };
}
