import { generateTwSafelist } from '@tailwind-tree/shared/utils/generateTwSafelist';
import type { Plugin } from 'vite';

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
