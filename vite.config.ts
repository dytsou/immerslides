import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { pageRedirects } from './starter/vite.config.js';
import tsconfig from './tsconfig.json' with { type: 'json' };

const { compilerOptions } = tsconfig;

export default defineConfig({
  root: 'starter',
  plugins: [react(), pageRedirects()],
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
