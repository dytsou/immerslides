# Line-by-line focus for code and flows

Focus mode is controlled by the player's existing `step`. The components do not create a separate playback progress. Regular slides keep `steps: 1`.

## Code

`CodeBlock` takes `language`, `steps`, `step`, and `still`. Each `CodeStep` uses a range that includes its start and end lines. Line numbers start at 1.

```tsx
import { CodeBlock, type CodeStep } from 'immerslides';

const source = [
  'async function loadUser(id: string) {',
  '  const response = await fetch("/users/" + id);',
  '  if (!response.ok) {',
  '    throw new Error("Could not load user");',
  '  }',
  '  return response.json();',
  '}',
].join('\n');

const codeSteps: readonly CodeStep[] = [
  {
    title: 'Fetch the data',
    detail: 'Send the request with a stable user ID.',
    lines: [[1, 2]],
  },
  {
    title: 'Handle failures',
    detail: 'Check the response status before reading the body.',
    lines: [[3, 5]],
  },
  {
    title: 'Return the result',
    detail: 'Turn a successful response into data for the caller.',
    lines: [[6, 7]],
  },
];

function CodeScene({ step, still }: { step: number; still: boolean }) {
  return (
    <CodeBlock
      filename="load-user.ts"
      language="typescript"
      steps={codeSteps}
      step={step}
      still={still}
    >
      {source}
    </CodeBlock>
  );
}
```

For the matching slide metadata, use `steps: codeSteps.length`. Pass the `step` and `still` the renderer receives into the component. Moving forward and back, reloading, and restoring a saved version all follow the player's behavior.

Group sections by meaning, such as getting input, validating it, and returning the result. Keep enough context in each section. Do not make every token or every line its own step. Long code brings the focused section into view. If a section is too long, split the explanation first.

## Flow diagrams

Focused flows use stable node `id`s. Each `TimelineStep.nodes` lists the nodes that this section should emphasize. A static flow that is not focused does not need `id`s.

```tsx
import { Timeline, type TimelineItem, type TimelineStep } from 'immerslides';

const items: readonly TimelineItem[] = [
  { id: 'request', title: 'Request', detail: 'The user sends a request.' },
  {
    id: 'check',
    title: 'Check',
    detail: 'Validate the input and permissions.',
  },
  {
    id: 'respond',
    title: 'Respond',
    detail: 'Return a usable result.',
    tone: 'good',
  },
];

const flowSteps: readonly TimelineStep[] = [
  {
    title: 'Start with the request',
    detail: 'Explain where the request comes from first.',
    nodes: ['request'],
  },
  {
    title: 'Confirm the conditions',
    detail: 'Put the required checks before processing.',
    nodes: ['check'],
  },
  {
    title: 'Form the result',
    detail: 'Describe the output of the complete process.',
    nodes: ['respond'],
  },
];

function FlowScene({ step, still }: { step: number; still: boolean }) {
  return <Timeline items={items} steps={flowSteps} step={step} still={still} />;
}
```

For the matching slide metadata, use `steps: flowSteps.length`. A section can focus several related nodes. Each row still holds one to three nodes, and a long flow moves onto a continuation slide.

## Syntax highlighting

`language` takes a highlight.js language name or alias, such as `typescript`, `ts`, `javascript`, `js`, `python`, `java`, `sql`, `json`, `yaml`, `bash`, `html`, or `css`.

If no language is set, or the language is not recognized, the raw text is shown and no language is guessed. The code is still text and is never executed as HTML. Highlighting for multi-line strings and comments must be continuous, and lines are not re-parsed independently.

## Verification

- Move forward, back, and quickly in reverse through each section. Confirm the focus and the description stay in sync.
- Confirm that the current section of long code stays visible, and that the original indentation and blank lines are preserved.
- Use code with multi-line comments, strings, and HTML tags to confirm the highlighting is correct and the text is safe.
- Turn on reduced motion and confirm that the focus switches directly. Static previews must not start autoplay or timers.
- Confirm that a CodeBlock and a Timeline without `steps` still show everything at once.
