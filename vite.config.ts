import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TwParsePlugin } from "./src/twTree/vite-plugin-twparse";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), TwParsePlugin.vite(), tailwindcss()],
});
