import { Plugin } from 'vite';

declare function getTwSafelist(): string[];

declare const generateTwSafelist: () => Promise<void>;

declare function twTreePlugin(): Plugin;

export { generateTwSafelist, getTwSafelist, twTreePlugin };
