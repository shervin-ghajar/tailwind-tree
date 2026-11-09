import { useState } from 'react';
import { twTree } from 'tailwind-tree';

export default function App() {
  const [active, setActive] = useState(false);

  return (
    <main>
      <h1>Tailwind v3 playground</h1>
      <p>Toggle the state, hover the preview, or edit its tree to check live updates.</p>
      <button type="button" aria-pressed={active} onClick={() => setActive((value) => !value)}>
        Toggle state
      </button>
      <div
        id="preview"
        className={twTree(
          [
            'w-48 rounded-lg p-4 p-6 text-white',
            active ? 'bg-emerald-600' : 'bg-blue-600',
            {
              hover: 'bg-slate-800',
              md: { hover: 'opacity-50' },
            },
          ],
          { version: 3, prefix: 'tw-' },
        )}
      >
        {active ? 'Active' : 'Inactive'}
      </div>
      <output aria-label="Generated classes">
        {twTree(
          [
            'w-48 rounded-lg p-4 p-6 text-white',
            active ? 'bg-emerald-600' : 'bg-blue-600',
            {
              hover: 'bg-slate-800',
              md: { hover: 'opacity-50' },
            },
          ],
          { version: 3, prefix: 'tw-' },
        )}
      </output>
    </main>
  );
}
