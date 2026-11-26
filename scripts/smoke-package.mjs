import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const metadata = JSON.parse(
  await readFile(path.join(root, 'package.json'), 'utf8'),
);
const moduleEntries = Object.entries(metadata.exports).filter(
  ([, target]) => typeof target === 'object',
);
const temporary = await mkdtemp(path.join(tmpdir(), 'immerslides-package-'));
const run = (command, args, cwd = root) =>
  execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
await mkdir(path.join(root, 'dist'), { recursive: true });
await writeFile(
  path.join(root, 'dist/retired-file.js'),
  'export const retired = true;\n',
);
run('pnpm', ['build']);
const tarball = path.join(temporary, 'immerslides.tgz');
const packed = JSON.parse(
  run('pnpm', [
    '--config.ignore-scripts=true',
    'pack',
    '--json',
    '--out',
    tarball,
  ]),
);
const files = packed.files.map((file) => file.path);
assert(
  !files.includes('dist/retired-file.js'),
  'Build removes retired output files',
);
for (const required of [
  'LICENSE',
  'dist/index.js',
  'dist/index.d.ts',
  'dist/styles.css',
  'bin/immerslides.mjs',
  'starter/.nvmrc',
  'starter/src/deck.tsx',
  'skills/immerslides/SKILL.md',
])
  assert(files.includes(required), `Packed archive contains ${required}`);
for (const [, target] of moduleEntries)
  for (const required of [target.import, target.types])
    assert(
      files.includes(required.slice(2)),
      `Packed archive contains ${required}`,
    );
assert(
  !files.some(
    (file) =>
      /^(references|tests|\.audit)\//.test(file) ||
      /(^|\/)node_modules\//.test(file),
  ),
  'Packed archive excludes development and reference files',
);
const host = path.join(temporary, 'host');
await mkdir(host);
await writeFile(
  path.join(host, 'package.json'),
  JSON.stringify({ private: true, packageManager: 'pnpm@11.29.0' }),
);
run('pnpm', ['add', '--ignore-scripts', tarball], host);
run(
  process.execPath,
  [
    '--input-type=module',
    '--eval',
    `
  import assert from 'node:assert/strict';
  import { registerHooks } from 'node:module';
  const loaded = new Set();
  registerHooks({ resolve(specifier, context, nextResolve) {
    const result = nextResolve(specifier, context);
    loaded.add(result.url);
    return result;
  }});
  for (const name of ['code-window', 'flow-node', 'flow-connector', 'step-description', 'slide-frame', 'chapter-guide', 'slide-preview']) {
    await import('immerslides/' + name);
  }
  assert(loaded.size, 'Dependency tracing observes actual module resolutions');
  assert(![...loaded].some(url => /highlight\\.js|presentation\\/(?:Player|Presenter|Stage|context|TransitionSnapshot)\\.js/.test(url)), 'Leaf components do not load highlighting or playback modules');
  const root = await import('immerslides');
  for (const name of ${JSON.stringify(moduleEntries.map(([entry]) => entry))}) {
    const entry = await import(name === '.' ? 'immerslides' : 'immerslides' + name.slice(1));
    assert(Object.keys(entry).length, name + ' exposes a runtime API');
    if (name !== '.') {
      const symbol = name === './deck' ? 'defineDeck' : name.slice(2).split('-').map(word => word[0].toUpperCase() + word.slice(1)).join('');
      assert.equal(typeof entry[symbol], 'function', name + ' exports ' + symbol);
    }
    for (const [symbol, value] of Object.entries(entry)) if (symbol in root) assert.equal(value, root[symbol], name + ' preserves ' + symbol);
  }
`,
  ],
  host,
);
const consumer = path.join(temporary, 'my-talk');
run('pnpm', ['exec', 'immerslides', 'create', consumer], host);
assert.equal(
  await readFile(path.join(consumer, '.nvmrc'), 'utf8'),
  '26\n',
  'Generated project selects Node.js 26',
);
const projectPath = path.join(consumer, 'package.json');
const project = JSON.parse(await readFile(projectPath, 'utf8'));
project.dependencies['immerslides'] = `file:${tarball}`;
await writeFile(projectPath, JSON.stringify(project, null, 2) + '\n');
run('pnpm', ['install', '--ignore-scripts'], consumer);
await writeFile(
  path.join(consumer, 'src/component-imports.ts'),
  moduleEntries
    .map(
      ([entry], index) =>
        `export * as component${index} from '${entry === '.' ? 'immerslides' : 'immerslides' + entry.slice(1)}';`,
    )
    .join('\n') + '\n',
);
run('pnpm', ['build'], consumer);
assert(
  (await readdir(path.join(consumer, 'dist'))).includes('index.html'),
  'Generated consumer builds a real HTML presentation',
);
assert.equal(
  await readFile(
    path.join(consumer, '.agents/skills/immerslides/SKILL.md'),
    'utf8',
  ),
  await readFile(path.join(root, 'skills/immerslides/SKILL.md'), 'utf8'),
  'Generated project receives canonical skill',
);
console.log(
  `Package smoke test passed.\nTarball: ${tarball}\nConsumer: ${consumer}`,
);
