# Tailwind v3 playground

Uses the workspace runtime with Tailwind v3 and tailwind-merge 2.6. The runtime is injected into this consumer so pnpm resolves its merger peer from this app, rather than a sibling's version.

This playground demonstrates the optional `tw-` prefix: `vite.config.ts` sets Tailwind's `prefix: 'tw-'`, and `src/App.tsx` passes `{ version: 3, prefix: 'tw-' }` to `twTree`. For example:

```ts
twTree(['p-4', { hover: 'bg-blue-500' }], { version: 3, prefix: 'tw-' });
// tw-p-4 hover:tw-bg-blue-500
```

To use no prefix, remove Tailwind's `prefix` option in `vite.config.ts` and remove `prefix` from both `twTree` calls in `src/App.tsx`, keeping `version: 3`:

```ts
twTree(['p-4', { hover: 'bg-blue-500' }], { version: 3 });
// p-4 hover:bg-blue-500
```

Keep the existing `content.transform` and stylesheet directives in either setup. Tree leaf strings stay unprefixed.

From the workspace root, run `pnpm build`, then `pnpm dev:v3`. Toggle the state and hover the preview to see both DOM classes and actual styles change. Editing `src/App.tsx` updates through Vite without a page reload. The generated classes are displayed below the preview.

`pnpm test:playgrounds` checks both playgrounds in headless Chrome, including state changes, hover variants, live source edits, peer isolation, and the production module boundary. No scanner or parser is included in the browser bundle.
