import type { Plugin } from 'vite';

import { generateTwSafelist } from '../../shared/src/utils/generateTwSafelist';

export function twTreePlugin(): Plugin {
  return {
    name: 'vite-plugin-tailwind-tree',

    handleHotUpdate({ file }) {
      generateTwSafelist([file]);
    },

    buildStart() {
      generateTwSafelist();
    },
  };
}
