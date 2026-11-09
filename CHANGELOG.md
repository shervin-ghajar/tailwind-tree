# Unreleased

This release corrects behavior and includes integration changes that need a minor-version migration before publication:

- Use `transformTwTree` in Tailwind v3 `content.transform`; `extractTwTree` now accepts complete files and does not attempt to recover arbitrary line fragments.
- Install a matching `tailwind-merge` peer (2.6 for v3, 3.x for v4), or use `tailwind-tree/core` without merging.
- `prefix` is a Tailwind namespace, separate from nested variant accumulation. Set `version: 3` for v3 prefix placement.
- The Vite plugin scans `src` by default and writes `.tailwind-tree/candidates.txt` under Vite's root. Configure `sources` for other directories. It injects the `@source` directive; existing safelist imports remain supported.
- Unsupported static expressions fail builds instead of silently dropping styles. Production extraction does not execute user code or resolve imported tree values.
- Nested arrays, empty values, static templates, import aliases, TS wrappers, candidate deletion, and application isolation are fixed.

The public package versions are intentionally unchanged until a release is prepared. Nothing is published by the build or validation commands.

- Added separate v3/v4 playgrounds with isolated merger peers and real-browser validation of rendered classes, computed styles, and hot edits without a reload.

- Added recursive object-key completions for common Tailwind variants through public types, including nested arrays and custom-key compatibility. No runtime JavaScript was added.

- Added scan-only transformed sources to the Vite plugin. Tailwind v4.0+ apps can use `source(none)` plus explicit template sources to avoid redundant raw tree leaf rules. The v3 content transform now also masks tree-only inputs and constants while preserving ordinary class detection.
