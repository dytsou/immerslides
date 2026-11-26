import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { type Connect, defineConfig, type Plugin } from 'vite';

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const pages = ['slides', 'site'];

/** Sends `/slides` to `/slides/` so the page and its relative URLs load from its own directory. */
export const pageRedirects = (): Plugin => {
  const redirect: Connect.NextHandleFunction = (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (!pages.includes(url.pathname.slice(1))) return next();
    res.statusCode = 302;
    res.setHeader('Location', `${url.pathname}/${url.search}`);
    res.end();
  };
  return {
    name: 'immerslides:page-redirects',
    configureServer: (server) => void server.middlewares.use(redirect),
    configurePreviewServer: (server) => void server.middlewares.use(redirect),
  };
};

export default defineConfig({
  plugins: [react(), pageRedirects()],
  base: './',
  build: {
    rolldownOptions: {
      input: {
        main: entry('./index.html'),
        ...Object.fromEntries(
          pages.map((page) => [page, entry(`./${page}/index.html`)]),
        ),
      },
    },
  },
});
