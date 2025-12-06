import { Plugin } from 'vite';

declare function twTreePlugin(): Plugin;

declare const generateTwSafelist: () => Promise<void>;

export { generateTwSafelist, twTreePlugin };
