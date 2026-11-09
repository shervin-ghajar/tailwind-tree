import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { gzipSync } from 'node:zlib';
import { rollup } from 'rollup';

for (const [name, input, limit] of [
  ['browser core', 'packages/tailwind-tree/dist/core.mjs', 650],
  ['browser with merger', 'packages/tailwind-tree/dist/index.mjs', 11000],
]) {
  const bundle = await rollup({
    input,
    plugins: [resolve({ browser: true }), terser()],
    onwarn: (warning) => {
      throw new Error(warning.message);
    },
  });
  try {
    const { output } = await bundle.generate({ format: 'esm' });
    const code = output.map((chunk) => chunk.code ?? '').join('');
    assert.ok(
      !/@babel\/|node:fs|node:path|process\.exit/.test(code),
      `${name}: build tooling leaked into browser code`,
    );
    const compressed = gzipSync(code).length;
    assert.ok(compressed <= limit, `${name}: gzip ${compressed} exceeds ${limit}`);
    console.log(
      `${name}: ${Buffer.byteLength(code)} bytes raw / ${compressed} bytes gzip (including bundled dependencies)`,
    );
  } finally {
    await bundle.close();
  }
}
for (const name of ['extractor', 'plugin']) {
  const data = fs.readFileSync(`packages/${name}/dist/index.mjs`);
  assert.ok(data.length < 12000, `${name}: build-time dependencies should stay external`);
  console.log(
    `${name}: ${data.length} bytes raw / ${gzipSync(data).length} bytes gzip (external Babel dependencies excluded)`,
  );
}
