import type { Plugin, ViteDevServer } from "vite";
import { generateTwSafelist } from "./utils/generateTwSafelist";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export function twTreePlugin(): Plugin {
  let server: ViteDevServer | undefined;

  return {
    name: "vite-plugin-tailwind-tree",

    configureServer(_server) {
      server = _server;

      // Watch for changes to the safelist file and trigger full reload
      const safelistPath = path.resolve(__dirname, "../tw-safelist.js");
      fs.watchFile(safelistPath, () => {
        console.log("[tailwind-tree] 🔄 tw-safelist.js updated — restarting server");
        server?.restart(); // force dev server restart
      });
    },

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
