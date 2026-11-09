# @tailwind-tree/extractor

Node-only full-file extraction and source generation for Tailwind Tree. Supports Tailwind v3 through `content.transform` and v4 through generated candidate files.

```sh
pnpm add tailwind-tree tailwind-merge@^2.6.0
pnpm add -D @tailwind-tree/extractor
```

The following Tailwind v3 configuration works without a prefix:

```js
// tailwind.config.js
import { transformTwTree } from '@tailwind-tree/extractor';

export default {
  content: {
    files: ['./src/**/*.{js,jsx,ts,tsx}'],
    transform: {
      js: transformTwTree,
      jsx: transformTwTree,
      ts: (source) => transformTwTree(source, 'source.ts'),
      tsx: transformTwTree,
    },
  },
};
```

Use `content.transform`, not `content.extract`: Tailwind v3 invokes custom extractors one line at a time, losing outer variants. The transform replaces tree inputs and tree-only constants in scan text with complete candidates, preserving ordinary classes, runtime conditions, shared constants, and exported values. Its output is for Tailwind's scanner, not executable JavaScript.

## Without a prefix

Leave `prefix` unset in both Tailwind and `twTree`:

```ts
import { twTree } from 'tailwind-tree';

twTree(['p-4', { hover: 'bg-blue-500' }], { version: 3 });
// p-4 hover:bg-blue-500
```

## With an optional prefix

Add `prefix: 'tw-'` to the Tailwind config above and match it in `twTree`:

```ts
import { twTree } from 'tailwind-tree';

twTree(['p-4', { hover: 'bg-blue-500' }], { version: 3, prefix: 'tw-' });
// tw-p-4 hover:tw-bg-blue-500
```

Tree leaf strings stay unprefixed. Ordinary markup uses complete classes such as `tw-p-4 hover:tw-bg-blue-500`. Both setups use the same `content.transform` and standard v3 stylesheet directives (`@tailwind base;`, `@tailwind components;`, `@tailwind utilities;`).

## Generated files and other exports

Additional exports:

- `extractTwTree(source, filename?)`: sorted candidates from a complete JS/TS file. Supports import aliases, local constants, spreads, conditionals, and TS wrappers. Unsupported runtime expressions throw with a filename and location.
- `generateTwSafelist(files?, output?)`: replaces a plain-text candidate file. Defaults to scanning `./src` and writing `.tailwind-tree/candidates.txt`.
- `collectUsedClasses(files)`: candidates as a set.
- `writeSafelistFile(classes, output?)`: sorted, deduplicated, atomic output; returns whether content changed.

For v4 CLI/PostCSS, run the generator before your build and register its output with `@source '../.tailwind-tree/candidates.txt';` relative to the stylesheet. For v3, include the output in `content.files`.

This package does not execute user code, resolve imported tree values, or support line fragments. See the [main documentation](https://github.com/shervin-ghajar/tailwind-tree#readme) for the extraction contract, prefix options, and migration instructions.
