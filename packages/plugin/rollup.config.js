import { packageConfig } from '../../rollup.config.js';

const configs = packageConfig();
configs[1].plugins.push({
  name: 'vite-declaration-resolution',
  // Vite's Plugin type is ESM-only; declaration bundling drops resolution attributes.
  renderChunk(code) {
    return code.replace(
      /import (\{[^}]+\}) from ['"]vite['"];/g,
      "import type $1 from 'vite' with { 'resolution-mode': 'import' };",
    );
  },
});
export default configs;
