import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite' with { 'resolution-mode': 'import' };
import { prepareTwTreeSource } from '../../shared/src/utils/extractTwTree';
import {
  getAllSourceFiles,
  isSourceFile,
  writeSafelistFile,
} from '../../shared/src/utils/generateTwSafelist';

export interface TwTreePluginOptions {
  /** Source directories or files, relative to Vite's root. Symlinks are not followed. */
  sources?: string[];
  /** Application-owned candidate file, relative to Vite's root. */
  output?: string;
}

export function twTreePlugin(options: TwTreePluginOptions = {}): Plugin {
  let sources: string[] = [];
  let output = '';
  const candidates = new Map<string, string[]>();
  const scanSources = new Map<string, string>();
  const errors = new Set<string>();
  const stylesheets = new Set<string>();
  const write = () => {
    const changed = writeSafelistFile([...candidates.values()].flat(), output);
    return writeSafelistFile([...scanSources.values()], `${output}.sources.txt`) || changed;
  };

  function read(file: string) {
    const code = fs.readFileSync(file, 'utf8');
    const { candidates: classes, source } = prepareTwTreeSource(code, file);
    candidates.set(file, classes);
    scanSources.set(file, source);
  }

  function isIncluded(file: string): boolean {
    return (
      isSourceFile(file) &&
      sources.some((source) => {
        const relative = path.relative(source, file);
        return (
          relative === '' ||
          (!relative.startsWith('..') &&
            !path.isAbsolute(relative) &&
            relative
              .split(path.sep)
              .every(
                (part) =>
                  !part.startsWith('.') &&
                  !['node_modules', 'dist', 'build', 'coverage'].includes(part),
              ))
        );
      })
    );
  }

  async function update(server: ViteDevServer, file: string) {
    if (!isIncluded(file)) return;
    try {
      if (fs.existsSync(file)) read(file);
      else {
        candidates.delete(file);
        scanSources.delete(file);
      }
      const changed = write();
      if (errors.delete(file)) server.ws.send({ type: 'full-reload' });
      if (!changed) return;
      for (const id of stylesheets) {
        const module = server.moduleGraph.getModuleById(id);
        if (module) await server.reloadModule(module);
      }
    } catch (error) {
      errors.add(file);
      const message = (error as Error).message;
      server.config.logger.error(message);
      server.ws.send({ type: 'error', err: { message, stack: (error as Error).stack ?? '' } });
    }
  }

  return {
    name: 'vite-plugin-tailwind-tree',
    enforce: 'pre',
    configResolved(config) {
      sources = (options.sources ?? ['src']).map((source) => path.resolve(config.root, source));
      output = path.resolve(config.root, options.output ?? '.tailwind-tree/candidates.txt');
    },
    buildStart() {
      candidates.clear();
      scanSources.clear();
      for (const file of getAllSourceFiles(sources)) {
        read(file);
        this.addWatchFile(file);
      }
      for (const source of sources) this.addWatchFile(source);
      write();
    },
    configureServer(server) {
      const listener = (file: string) => {
        void update(server, file);
      };
      server.watcher.add(sources);
      server.watcher.on('add', listener).on('change', listener).on('unlink', listener);
      server.httpServer?.once('close', () => {
        server.watcher.off('add', listener).off('change', listener).off('unlink', listener);
      });
    },
    transform(code, id) {
      const file = id.split('?')[0];
      if (!file.endsWith('.css')) return;
      const legacyImport = /@import\s+['"]@tailwind-tree\/vite-plugin\/safelist['"]\s*;/g;
      if (
        !/@import\s+['"]tailwindcss(?:\/[^'"]*)?['"]/.test(code) &&
        !code.includes('@tailwind-tree/vite-plugin/safelist')
      )
        return;
      stylesheets.add(id);
      const relative = path.relative(path.dirname(file), output).split(path.sep).join('/');
      return {
        code: `${code.replace(legacyImport, '')}\n@source ${JSON.stringify('./' + relative)};\n@source ${JSON.stringify('./' + relative + '.sources.txt')};\n`,
        map: null,
      };
    },
  };
}
