import { Plugin } from 'vite';

declare const generateTwSafelist: () => Promise<void>;

declare function twTreePlugin(): Plugin;

export { generateTwSafelist, twTreePlugin };
