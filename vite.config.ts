import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { compilerOptions } from './tsconfig.json';

export default defineConfig({
  root: 'starter',
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: 'immerslides/styles.css',
        replacement: fileURLToPath(
          new URL('./src/styles.css', import.meta.url),
        ),
      },
      ...Object.entries(compilerOptions.paths).map(([name, [source]]) => ({
        find: name === 'immerslides' ? /^immerslides$/ : name,
        replacement: fileURLToPath(new URL(source, import.meta.url)),
      })),
    ],
  },
});
