import { execFileSync, spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';

const cli = path.resolve('bin/immerslides.mjs');

it('creates a standalone starter with the exact packaged project skill', () => {
  const parent = mkdtempSync(path.join(tmpdir(), 'immerslides-cli-'));
  const target = path.join(parent, 'my-talk');
  execFileSync(process.execPath, [cli, 'create', target]);
  const project = JSON.parse(
    readFileSync(path.join(target, 'package.json'), 'utf8'),
  );
  expect(project.name).toBe('my-talk');
  expect(project.dependencies['immerslides']).toBe('^0.1.0');
  expect(project.engines.node).toBe('>=26.0.0');
  expect(readFileSync(path.join(target, '.nvmrc'), 'utf8')).toBe('26\n');
  expect(
    readFileSync(
      path.join(target, '.agents/skills/immerslides/SKILL.md'),
      'utf8',
    ),
  ).toBe(readFileSync('skills/immerslides/SKILL.md', 'utf8'));
  expect(
    readFileSync(
      path.join(target, '.agents/skills/immerslides-en/SKILL.md'),
      'utf8',
    ),
  ).toBe(readFileSync('skills/immerslides-en/SKILL.md', 'utf8'));
  expect(
    readFileSync(
      path.join(target, '.agents/skills/immerslides-en/references/urls.md'),
      'utf8',
    ),
  ).toBe(readFileSync('skills/immerslides-en/references/urls.md', 'utf8'));
  expect(readFileSync(path.join(target, 'src/main.tsx'), 'utf8')).toContain(
    "from 'immerslides/player'",
  );
  for (const entry of ['index.html', 'slides/index.html', 'site/index.html'])
    expect(readFileSync(path.join(target, entry), 'utf8')).toContain(
      '<div id="root"></div>',
    );
  expect(readFileSync(path.join(target, 'src/config.ts'), 'utf8')).toContain(
    "defaultView: 'slides' | 'site' = 'slides'",
  );
});

it('creates a starter in an existing empty directory', () => {
  const target = mkdtempSync(path.join(tmpdir(), 'immerslides-empty-'));
  execFileSync(process.execPath, [cli, 'create', target]);
  expect(readFileSync(path.join(target, 'src/main.tsx'), 'utf8')).toContain(
    "from 'immerslides/player'",
  );
  expect(
    readFileSync(
      path.join(target, '.agents/skills/immerslides/SKILL.md'),
      'utf8',
    ),
  ).toBe(readFileSync('skills/immerslides/SKILL.md', 'utf8'));
});

it('uses the canonical import name when installed from a scoped registry package', () => {
  const parent = mkdtempSync(path.join(tmpdir(), 'immerslides-scoped-cli-'));
  const packageRoot = path.join(parent, 'package');
  mkdirSync(path.join(packageRoot, 'bin'), { recursive: true });
  cpSync(cli, path.join(packageRoot, 'bin/immerslides.mjs'));
  cpSync('starter', path.join(packageRoot, 'starter'), {
    recursive: true,
    filter: (source) =>
      !['node_modules', 'dist'].includes(path.basename(source)),
  });
  cpSync('skills', path.join(packageRoot, 'skills'), { recursive: true });
  writeFileSync(
    path.join(packageRoot, 'package.json'),
    JSON.stringify({ name: '@octo-org/immerslides', version: '0.7.3' }),
  );
  const target = path.join(parent, 'my-talk');
  execFileSync(process.execPath, [
    path.join(packageRoot, 'bin/immerslides.mjs'),
    'create',
    target,
  ]);
  const project = JSON.parse(
    readFileSync(path.join(target, 'package.json'), 'utf8'),
  );
  expect(project.dependencies.immerslides).toBe(
    'npm:@octo-org/immerslides@^0.7.3',
  );
  expect(
    Object.keys(project.dependencies).filter((name) =>
      name.includes('immerslides'),
    ),
  ).toEqual(['immerslides']);
  expect(readFileSync(path.join(target, 'src/main.tsx'), 'utf8')).toContain(
    "from 'immerslides/player'",
  );
});

it('rejects nonempty destinations and symlinks without changing existing files', () => {
  const parent = mkdtempSync(path.join(tmpdir(), 'immerslides-conflict-'));
  const target = path.join(parent, 'existing');
  mkdirSync(target);
  writeFileSync(path.join(target, 'keep.txt'), 'unchanged');
  const result = spawnSync(process.execPath, [cli, 'create', target]);
  expect(result.status).toBe(1);
  expect(readdirSync(target)).toEqual(['keep.txt']);
  expect(readFileSync(path.join(target, 'keep.txt'), 'utf8')).toBe('unchanged');
  const link = path.join(parent, 'link');
  symlinkSync(target, link);
  expect(spawnSync(process.execPath, [cli, 'create', link]).status).toBe(1);
  expect(readdirSync(target)).toEqual(['keep.txt']);
});

it('rejects unsupported commands before creating a destination', () => {
  const parent = mkdtempSync(path.join(tmpdir(), 'immerslides-args-'));
  expect(
    spawnSync(process.execPath, [cli, 'publish', path.join(parent, 'no')])
      .status,
  ).toBe(1);
  expect(readdirSync(parent)).toEqual([]);
});

it('prints shell-safe instructions for directories containing shell syntax', () => {
  const parent = mkdtempSync(path.join(tmpdir(), 'immerslides-quote-'));
  const target = path.join(parent, "my $(date) 'talk");
  const output = execFileSync(process.execPath, [cli, 'create', target], {
    encoding: 'utf8',
  });
  const line = output.split('\n').find((line) => line.startsWith('  cd '))!;
  const resolved = execFileSync('/bin/sh', ['-c', line.trim() + ' && pwd'], {
    encoding: 'utf8',
  }).trim();
  expect(resolved).toBe(target);
});
