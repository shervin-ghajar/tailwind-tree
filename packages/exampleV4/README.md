# Tailwind v4 playground

Uses the workspace runtime with Tailwind v4 and tailwind-merge 3.x. The runtime is injected into this consumer so pnpm resolves its merger peer from this app, rather than a sibling's version.

The stylesheet uses `source(none)` and explicitly registers `index.html`. The Tree plugin registers transformed scan text for `src`, preserving ordinary classes while avoiding redundant unqualified tree leaves. Register any additional JS/TS roots in the plugin's `sources`, and other templates with `@source`.

This playground demonstrates the optional `tw` prefix. Its `src/index.css` starts with:

```css
@import 'tailwindcss' prefix(tw) source(none);
@source '../index.html';
```

The matching call in `src/App.tsx` passes `{ version: 4, prefix: 'tw' }`:

```ts
twTree(['p-4', { hover: 'bg-blue-500' }], { version: 4, prefix: 'tw' });
// tw:p-4 tw:hover:bg-blue-500
```

To use no prefix, remove `prefix(tw)` from the stylesheet and `prefix` from the `twTree` options:

```css
@import 'tailwindcss' source(none);
@source '../index.html';
```

```ts
twTree(['p-4', { hover: 'bg-blue-500' }]);
// p-4 hover:bg-blue-500
```

Keep `source(none)`, `@source`, and the Vite plugins in either setup. Tree leaf strings stay unprefixed.

From the workspace root, run `pnpm build`, then `pnpm dev:v4`. Toggle the state and hover the preview to see both DOM classes and actual styles change. Editing `src/App.tsx` updates through Vite without a page reload. The generated classes are displayed below the preview.

`pnpm test:playgrounds` checks both playgrounds in headless Chrome, including state changes, hover variants, live source edits, peer isolation, and the production module boundary. No scanner or parser is included in the browser bundle.
