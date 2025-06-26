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

    configureServer(_server) {
      server = _server;

      const safelistPath = path.resolve(process.cwd(), "node_modules/tailwind-tree-monorepo/packages/tailwind-tree/dist/tw-safelist.js");

      // Watch for changes and trigger full reload (debounced)
      const triggerReload = debounce(() => {
        console.log("[tailwind-tree] 🔄 tw-safelist.js updated — reloading browser");
        server?.ws.send({ type: "full-reload" });
      }, 500);

      server.watcher.add(safelistPath);
      server.watcher.on("change", (file) => {
        if (file === safelistPath) {
          triggerReload();
        }
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
