import type { Plugin } from 'vite';

import { generateTwSafelist } from './utils/generateTwSafelist';

export function twTreePlugin(): Plugin {
  return {
    name: 'vite-plugin-tailwind-tree',

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
