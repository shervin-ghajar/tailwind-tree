<div align="center">
    <a href="https://github.com/shervin-ghajar/tailwind-tree">
        <img src="https://raw.githubusercontent.com/shervin-ghajar/tailwind-tree/main/src/assets/logo-with-title.png" alt="tailwind-tree" style="max-width: 100%;height: 350px;">
    </a>
</div>

**Tailwind Tree** is a utility designed for writing deeply nested, composable Tailwind CSS classes using a simple and expressive tree structure. It simplifies the management of complex class combinations with responsive and interactive variants, supporting both **Tailwind** **v3** and **v4**.

---

## ✨ Features

- ✅ Declarative nested syntax
- ✅ Full support for variants such as `hover:`, `md:`, `focus:`, etc.
- ✅ Compatible with both **Tailwind v3** and **Tailwind v4**
- ✅ Automatic safelist generation for Tailwind's class scanning
- ✅ Integration with [`tailwind-merge`](https://www.npmjs.com/package/tailwind-merge) to efficiently merge Tailwind CSS classes in JS without style conflicts.

---

## 📦 Installation

To install Tailwind Tree, you can use one of the following package managers:

```bash
pnpm add tailwind-tree
# or
npm install tailwind-tree
# or
yarn add tailwind-tree
````

---

## 🚀 Usage

Instead of manually writing long variant chains, you can utilize `twTree` for a more streamlined approach:

### Previous Approach

```html
<div class="bg-amber-500 text-nowrap hover:bg-slate-600 hover:text-clip md:focus:text-blue-700" />
```

### Using `twTree`

```ts
import { twTree } from "tailwind-tree";

<div
  className={twTree([
    "bg-red-500 text-white",
    {
      hover: ['bg-slate-600', 'text-clip'],
      md: [{ focus: ["text-xl"] }],
    },
  ])}
/>;
```

This will produce the following output:

```ts
'bg-amber-500 text-nowrap hover:bg-slate-600 hover:text-clip md:focus:text-blue-700';
```

### Complex Nested Example

```ts
twTree([
  'text-white',
  isActive ? `bg-green-500` : 'bg-green-300',
  {
    hover: [
      'underline',
      'opacity-50',
      isFocused ? 'bg-blue-200' : `bg-blue-100`,
      {
        active: ['scale-105', `font-semibold`],
      },
    ],
    focus: [
      'ring-2',
      {
        visible: ['ring-green-500', isError ? `ring-red-500` : 'ring-yellow-500'],
      },
    ],
  },
  anotherCondition ? 'p-4' : 'p-2',
  ['font-bold', `tracking-wide`],
]);
```

This complex example supports:

* Nested variant objects (`hover:active`, `focus:visible`, etc.)
* Conditional expressions with ternaries
* Template literals mixed with strings
* Multiple levels of nesting and arrays


### Integration with `tailwind-merge`

The `twTree` function relies on [tailwind-merge](https://www.npmjs.com/package/tailwind-merge) to efficiently merge Tailwind CSS classes in JS without style conflicts. This means that you do not need to manually handle merging; it is automatically taken care of within the `twTree` implementation.

---

## ⚙️ Tailwind v4 Setup

With the removal of `content.extract` in Tailwind v4, the `tailwind-tree` library provides a plugin that automatically generates a safelist from `twTree(...)` usage.

### 1. Add the Plugin to Your Vite Config

```ts
// vite.config.ts
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
import { twTreePlugin } from 'tailwind-tree/vite'; // <--- import twTreePlugin()
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    twTreePlugin(), // <--- add twTreePlugin()
    tailwindcss()
  ],
});
```

This configuration ensures that Tailwind includes all classes generated via `twTree`.

> 🧠 **Note:** Tailwind may still generate **redundant classes** since it scans all string content. This is a limitation of Tailwind v4's class detection system.

---

## ⚙️ Tailwind v3 Setup

In Tailwind v3, class extraction can be overridden directly using `content.extract`.

### 1. Import the Extractor

```ts
// tailwind.config.js
import { extractTwTree } from 'tailwind-tree';

export default {
  content: [
    {
      files: ['./src/**/*.{ts,tsx,js,jsx}'],
      extract: extractTwTree,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

This setup allows Tailwind to parse `twTree(...)` usage directly and **precisely extract nested classes**, eliminating redundancy.

---
You're absolutely right — if `twTree` accepts options (e.g., for customizing behavior like merging, flattening, or variants), the README should clearly document them. Here's how you can add an **"Options"** section under the usage docs.

---

## ⚙️ Options

The `twTree` function supports an optional second parameter to customize its behavior:

```ts
twTree(input, options?)
```

### Available Options

| Option      | Type      | Default | Description                                                             |
| ----------- | --------- | ------- | ----------------------------------------------------------------------- |
| `merge`     | `boolean` | `true`  | Whether to apply `tailwind-merge` to merge conflicting utility classes. |
| `prefix`    | `string` |  `""`   | Adds a static prefix to all class names (e.g., "tw-" → tw-bg-red-500).                   |

### Example Usage

```ts
twTree(
  [
    'bg-red-500',
    { hover: ['bg-red-600'], focus: ['bg-red-700'] },
  ],
  {
    merge: false,
    prefix: 'tw-',
  }
);
```

### Output (with merge: false)

```
"tw-bg-red-500 tw-hover:bg-red-600 tw-focus:bg-red-700"
```

---

> 🧠 **Note:** When `merge: false`, classes will not be deduplicated or resolved for conflicts.

---


## 📜 License

This project is licensed under the MIT License. For more details, please refer to the [LICENSE file](https://github.com/shervin-ghajar/tailwind-tree/blob/main/LICENSE).

---

Made with 💙 by [@shervin-ghajar](https://github.com/shervin-ghajar)

```

