import type { Plugin, ViteDevServer } from "vite";
import { generateTwSafelist } from "./utils/generateTwSafelist";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility: debounce function
function debounce(fn: () => void, delay = 300) {
  let timer: NodeJS.Timeout;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

export function twTreePlugin(): Plugin {
  let server: ViteDevServer | undefined;

  return {
    name: "vite-plugin-tailwind-tree",

    handleHotUpdate() {
      generateTwSafelist();
    },

    buildStart() {
      generateTwSafelist();
    },

    closeBundle() {
      generateTwSafelist();
    },
  };
}
