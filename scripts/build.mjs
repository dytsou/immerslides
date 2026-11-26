import { execFileSync } from 'node:child_process';
import { access, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
execFileSync(
  process.execPath,
  [
    fileURLToPath(
      new URL('../node_modules/typescript/bin/tsc', import.meta.url),
    ),
    '-p',
    fileURLToPath(new URL('../tsconfig.build.json', import.meta.url)),
  ],
  { stdio: 'inherit' },
);
await copyFile(
  new URL('../src/styles.css', import.meta.url),
  new URL('styles.css', output),
);
await access(new URL('index.js', output));
await access(new URL('index.d.ts', output));
