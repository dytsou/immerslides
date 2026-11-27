#!/usr/bin/env node
import {
  cp,
  lstat,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const metadata = JSON.parse(
  await readFile(path.join(root, 'package.json'), 'utf8'),
);
const args = process.argv.slice(2);

try {
  if (
    args.length === 0 ||
    (args.length === 1 && ['--help', '-h'].includes(args[0]))
  ) {
    console.log(
      'Usage: immerslides create <directory>\nCreates a React/Vite presentation and its project skill.',
    );
  } else if (args.length === 1 && args[0] === '--version') {
    console.log(metadata.version);
  } else {
    if (
      args.length !== 2 ||
      args[0] !== 'create' ||
      !args[1] ||
      args[1].startsWith('-')
    )
      throw new Error('Usage: immerslides create <directory>');
    const destination = path.resolve(args[1]);
    const existing = await lstat(destination).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
    if (
      existing &&
      (!existing.isDirectory() || (await readdir(destination)).length > 0)
    )
      throw new Error(
        'The destination must be a new or empty directory. Existing files were not changed.',
      );
    const skills = ['immerslides', 'immerslides-en'];
    for (const name of skills)
      await readFile(path.join(root, 'skills', name, 'SKILL.md'));
    await mkdir(destination, { recursive: true });
    const starter = path.join(root, 'starter');
    for (const entry of await readdir(starter)) {
      await cp(path.join(starter, entry), path.join(destination, entry), {
        recursive: true,
        force: false,
        errorOnExist: true,
        filter: (source) =>
          !['node_modules', 'dist'].includes(path.basename(source)),
      });
    }
    for (const name of skills)
      await cp(
        path.join(root, 'skills', name),
        path.join(destination, '.agents/skills', name),
        { recursive: true, force: false, errorOnExist: true },
      );
    const projectPath = path.join(destination, 'package.json');
    const project = JSON.parse(await readFile(projectPath, 'utf8'));
    project.name =
      path
        .basename(destination)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/^-+|-+$/g, '') || 'my-immerslides';
    project.dependencies.immerslides =
      metadata.name === 'immerslides'
        ? `^${metadata.version}`
        : `npm:${metadata.name}@^${metadata.version}`;
    await writeFile(projectPath, JSON.stringify(project, null, 2) + '\n');
    await writeFile(
      path.join(destination, '.gitignore'),
      'node_modules/\ndist/\n.DS_Store\n',
    );
    const shellDirectory = "'" + destination.replaceAll("'", "'\\''") + "'";
    console.log(
      `Created ${destination}\n\nRun:\n  cd ${shellDirectory}\n  pnpm install\n  pnpm dev\n\nUse $immerslides (Chinese) or $immerslides-en (English) to create or revise the presentation.`,
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
