import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const entry = path.resolve('packages/tailwind-tree/src/index').replaceAll('\\', '/');

function languageService(code: string, extension = 'ts') {
  const file = path.resolve(`tests/variant-completion-fixture.${extension}`);
  const host: ts.LanguageServiceHost = {
    getCompilationSettings: () => ({
      strict: true,
      allowJs: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      types: [],
    }),
    getScriptFileNames: () => [file],
    getScriptVersion: () => '0',
    getScriptSnapshot(name) {
      const content = name === file ? code : ts.sys.readFile(name);
      return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content);
    },
    getCurrentDirectory: () => process.cwd(),
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: (name) => name === file || ts.sys.fileExists(name),
    readFile: (name) => (name === file ? code : ts.sys.readFile(name)),
    readDirectory: ts.sys.readDirectory,
  };
  return { service: ts.createLanguageService(host), file };
}

const examples = [
  'twTree([{ /*cursor*/ }]);',
  'twTree([{ md: { /*cursor*/ } }]);',
  'twTree([{ hover: ["p-4", { /*cursor*/ }] }]);',
];

describe('variant object key completions', () => {
  it.each([
    ['ts', entry],
    ['js', entry],
    ['ts', entry.replace('/index', '/core')],
    ['js', entry.replace('/index', '/core')],
  ])('suggests common variants at every nesting level in %s from %s', (extension, entry) => {
    for (const example of examples) {
      const code = `import { twTree } from '${entry}'; ${example}`;
      const position = code.indexOf('/*cursor*/');
      const { service, file } = languageService(code.replace('/*cursor*/', ''), extension);
      try {
        const names =
          service
            .getCompletionsAtPosition(file, position, {})
            ?.entries.map((entry) => entry.name) ?? [];
        expect(
          ['hover', 'md', 'focus', 'lg', 'dark'].filter((name) => !names.includes(name)),
        ).toEqual([]);
      } finally {
        service.dispose();
      }
    }
  });

  it('retains custom variants and readonly nested trees', () => {
    const code = `import { twTree } from '${entry}';
      twTree([{ 'custom-breakpoint': { '[&>svg]': ['p-4', false, null] } }] as const);
    `;
    const { service, file } = languageService(code);
    try {
      expect(
        service
          .getSemanticDiagnostics(file)
          .map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n')),
      ).toEqual([]);
    } finally {
      service.dispose();
    }
  });

  it('suggests keys in separately declared objects with satisfies TreeVariants', () => {
    const marked = `import {type TreeVariants} from '${entry}'; const variants = { /*cursor*/ } satisfies TreeVariants;`;
    const { service, file } = languageService(marked.replace('/*cursor*/', ''));
    try {
      const names =
        service
          .getCompletionsAtPosition(file, marked.indexOf('/*cursor*/'), {})
          ?.entries.map((entry) => entry.name) ?? [];
      expect(['hover', 'md'].filter((name) => !names.includes(name))).toEqual([]);
      expect(
        service
          .getSemanticDiagnostics(file)
          .map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n')),
      ).toEqual([]);
    } finally {
      service.dispose();
    }
  });
});
