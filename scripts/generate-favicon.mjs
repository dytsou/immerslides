import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import Avvvatars from 'avvvatars-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const markup = renderToStaticMarkup(
  createElement(Avvvatars.default, {
    value: 'immerslides',
    style: 'shape',
    size: 64,
  }),
);
const shape = markup.match(/<svg\b[\s\S]*?<\/svg>/)?.[0];
const background = markup.match(/^<div\b[^>]*\bcolor="([\da-f]{6})"/i)?.[1];
const foreground = markup.match(/<span\b[^>]*\bcolor="([\da-f]{6})"/i)?.[1];
assert(
  shape && background && foreground,
  'Official avatar contains SVG geometry and palette',
);
assert.match(
  shape,
  /viewBox="0 0 32 32"/,
  'Official shape retains its coordinate system',
);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>immerslides</title><circle cx="32" cy="32" r="32" fill="#${background}"/>${shape.replace('<svg ', '<svg x="16" y="16" height="32" ').replaceAll('currentColor', `#${foreground}`)}</svg>\n`;
assert(
  !/<(?:script|foreignObject|image|style|text)\b|\son\w+\s*=|(?:href|font-family)\s*=|url\(\s*[^#]/i.test(
    svg,
  ),
  'Favicon contains no executable content, fonts, or external assets',
);
assert(
  !svg.includes('currentColor'),
  'Favicon resolves the official foreground color',
);

const destination = new URL('../starter/public/favicon.svg', import.meta.url);
await writeFile(destination, svg);
assert.equal(
  await readFile(destination, 'utf8'),
  svg,
  'Written favicon matches the generated SVG',
);
await writeFile(
  new URL('../starter/public/avvvatars-LICENSE.txt', import.meta.url),
  await readFile(
    new URL('../node_modules/avvvatars-react/LICENSE', import.meta.url),
  ),
);
console.log('Generated starter/public/favicon.svg and avvvatars-LICENSE.txt');
