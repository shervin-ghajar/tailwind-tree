import { transformTwTree } from '@tailwind-tree/extractor';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          prefix: 'tw-',
          content: {
            files: [`${root}/src/**/*.{ts,tsx,js,jsx}`],
            transform: {
              ts: (source) => transformTwTree(source, 'source.ts'),
              tsx: transformTwTree,
              js: transformTwTree,
              jsx: transformTwTree,
            },
          },
        }),
      ],
    },
  },
});
