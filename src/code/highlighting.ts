import hljs from 'highlight.js/lib/common';

type Token = { text: string; className?: string };
export type CodeLineRange = readonly [number, number];

export function validateCodeRanges(
  ranges: readonly CodeLineRange[],
  lineCount: number,
) {
  if (
    !ranges.length ||
    ranges.some(
      ([start, end]) =>
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 1 ||
        end < start ||
        end > lineCount,
    )
  )
    throw new Error(
      'Code focus needs inclusive, 1-based line ranges within the source.',
    );
}

export function highlightLines(source: string, language?: string): Token[][] {
  const plain = () => source.split('\n').map((text) => [{ text }]);
  if (!language || !hljs.getLanguage(language)) return plain();
  const html = hljs.highlight(source, { language, ignoreIllegals: true }).value;
  const scopes: string[] = [];
  const lines: Token[][] = [[]];
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
  };
  for (const part of html.split(/(<span class="[^"]+">|<\/span>)/)) {
    if (part.startsWith('<span class="')) scopes.push(part.slice(13, -2));
    else if (part === '</span>') scopes.pop();
    else {
      const text = part.replace(
        /&(?:amp|lt|gt|quot|#x27);/g,
        (entity) => entities[entity],
      );
      text.split('\n').forEach((fragment, index) => {
        if (index) lines.push([]);
        if (fragment)
          lines
            .at(-1)!
            .push({ text: fragment, className: scopes.join(' ') || undefined });
      });
    }
  }
  return lines
    .map((line) => line.map((token) => token.text).join(''))
    .join('\n') === source
    ? lines
    : plain();
}
