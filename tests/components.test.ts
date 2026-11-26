import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { highlightLines } from '../src/code/highlighting';
import {
  CodeBlock,
  type CodeBlockProps,
  CodeWindow,
  FlowConnector,
  FlowNode,
  HighlightedCode,
  StepDescription,
  Timeline,
} from '../src/index';

it('renders complete timelines and rejects flows that need another page', () => {
  const html = renderToStaticMarkup(
    createElement(Timeline, {
      items: [{ title: '提交' }, { title: '檢查' }, { title: '回饋' }],
    }),
  );
  for (const title of ['提交', '檢查', '回饋']) expect(html).toContain(title);
  expect(() => Timeline({ items: [] })).toThrow();
  expect(() =>
    Timeline({ items: Array.from({ length: 4 }, () => ({ title: 'step' })) }),
  ).toThrow();
});

it('renders code as escaped text rather than executing HTML', () => {
  const html = renderToStaticMarkup(
    createElement(CodeBlock, {
      children: '<script>alert(1)</script>',
      filename: 'example.html',
    }),
  );
  expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  expect(html).not.toContain('<script>');
});

it.each([
  ['ts', 'const name: string = "Ada";'],
  ['js', 'const name = "Ada";'],
  ['py', 'def greet(name):\n    return f"Hello {name}"'],
  ['java', 'class Hello { String name = "Ada"; }'],
  ['sql', 'SELECT name FROM attendees WHERE id = 1;'],
  ['json', '{ "name": "Ada", "confirmed": true }'],
  ['yml', 'name: Ada\nconfirmed: true'],
  ['sh', '# Build the slides\npnpm build'],
  ['html', '<main class="slides">Hello</main>'],
  ['css', '.slides { color: #0071e3; }'],
])(
  'highlights %s aliases while preserving the source exactly',
  (language, source) => {
    const lines = highlightLines(source, language);
    expect(
      lines.flat().some((token) => token.className?.includes('hljs-')),
    ).toBe(true);
    expect(
      lines.map((line) => line.map((token) => token.text).join('')).join('\n'),
    ).toBe(source);
  },
);

it('keeps lexical scopes across lines, literal entities, indentation, and empty lines', () => {
  const source =
    '/* first line\n   still a comment\n\n   final comment */\nconst text = "&lt;tag&gt;";\n';
  const lines = highlightLines(source, 'ts');
  for (const index of [0, 1, 3])
    expect(
      lines[index].some((token) => token.className?.includes('hljs-comment')),
    ).toBe(true);
  expect(
    lines[4].some((token) => token.className?.includes('hljs-keyword')),
  ).toBe(true);
  expect(
    lines.map((line) => line.map((token) => token.text).join('')).join('\n'),
  ).toBe(source);
  expect(lines).toHaveLength(6);
  const literal =
    '<script>alert("&amp;")</script>\n\n  <img src=x onerror=alert(1)>';
  const html = renderToStaticMarkup(
    createElement(CodeBlock, { children: literal, language: 'html' }),
  );
  expect(html).not.toMatch(/<(script|img)\b/);
  expect(html).toContain('&lt;');
  expect(
    highlightLines(literal, 'unknown-language')
      .flat()
      .every((token) => !token.className),
  ).toBe(true);
  expect(highlightLines(literal)).toEqual(
    highlightLines(literal, 'unknown-language'),
  );
});

it('focuses inclusive source ranges and rejects invalid authored walkthroughs', () => {
  const props: CodeBlockProps = {
    children: 'const a = 1;\n\nconst b = 2;',
    language: 'ts',
    steps: [
      { title: 'Input', lines: [[1, 1]] },
      { title: 'Result', detail: 'The final line.', lines: [[3, 3]] },
    ],
    step: 1,
  };
  const render = (overrides: Partial<CodeBlockProps>) =>
    renderToStaticMarkup(createElement(CodeBlock, { ...props, ...overrides }));
  expect(render({})).toContain('data-line="3" data-focused="true"');
  expect(render({})).toContain('The final line.');
  expect(render({ step: 0 })).toContain('data-line="1" data-focused="true"');
  for (const step of [-1, 0.5, 2]) expect(() => render({ step })).toThrow();
  expect(() => render({ steps: [] })).toThrow();
  for (const lines of [[], [[0, 1]], [[2, 1]], [[1, 4]], [[1.5, 2]]] as const)
    expect(() =>
      render({ steps: [{ title: 'Invalid', lines }], step: 0 }),
    ).toThrow();
  expect(() =>
    render({
      steps: [
        { title: 'Valid', lines: [[1, 1]] },
        { title: 'Invalid future step', lines: [[4, 4]] },
      ],
      step: 0,
    }),
  ).toThrow();
});

it('focuses stable flow groups and validates every referenced node', () => {
  const items = [
    { id: 'input', title: 'Input' },
    { id: 'check', title: 'Check' },
    { id: 'result', title: 'Result' },
  ];
  const steps = [
    { title: 'Prepare', nodes: ['input', 'check'] },
    { title: 'Finish', nodes: ['result'] },
  ];
  const html = renderToStaticMarkup(createElement(Timeline, { items, steps }));
  expect(html.match(/data-focused="true"/g)).toHaveLength(2);
  expect(html).toContain('immerslides-flow-connector');
  for (const invalid of [
    [],
    [{ title: 'Missing', nodes: ['missing'] }],
    [{ title: 'Empty', nodes: [] }],
    [{ title: 'Repeated', nodes: ['input', 'input'] }],
  ])
    expect(() => Timeline({ items, steps: invalid })).toThrow();
  expect(() => Timeline({ items: [{ title: 'No ID' }], steps })).toThrow();
  expect(() =>
    Timeline({
      items: [
        { id: 'input', title: 'A' },
        { id: 'input', title: 'B' },
      ],
      steps,
    }),
  ).toThrow();
});

it('lets authors compose the same primitives without a player or context provider', () => {
  const html = renderToStaticMarkup(
    createElement(
      'section',
      null,
      createElement(StepDescription, {
        title: 'Prepare',
        step: 0,
        count: 2,
        children: 'Explain before the code.',
      }),
      createElement(CodeWindow, {
        filename: 'custom.py',
        children: createElement(HighlightedCode, {
          children: 'print("Hello")',
          language: 'py',
          focus: [[1, 1]],
          still: true,
        }),
      }),
      createElement(FlowNode, {
        title: 'Input',
        status: 'complete',
        children: createElement('em', null, 'Custom content'),
      }),
      createElement(FlowConnector, { status: 'active' }),
      createElement(FlowNode, { title: 'Check', status: 'active' }),
    ),
  );
  expect(html).toContain('Explain before the code.');
  expect(html).toContain('<em>Custom content</em>');
  expect(html).toContain('data-status="complete"');
  expect(html).toContain('hljs-built_in');
  expect(() =>
    renderToStaticMarkup(
      createElement(StepDescription, { title: 'Invalid', step: 2, count: 2 }),
    ),
  ).toThrow();
});
