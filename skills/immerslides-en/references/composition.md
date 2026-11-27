# Composable components

Place these components inside `SlideFrame`. They do not own playback progress. Pass in the same `step` from the renderer.

## Standalone imports

Import a single component for its purpose. Each entry loads that component and only the dependencies it needs.

| Entry                          | Exports                                                           |
| ------------------------------ | ----------------------------------------------------------------- |
| `immerslides/code-window`      | `CodeWindow`, `CodeWindowProps`                                   |
| `immerslides/highlighted-code` | `HighlightedCode`, `HighlightedCodeProps`, `CodeLineRange`        |
| `immerslides/code-block`       | `CodeBlock`, `CodeBlockProps`, `CodeStep`, `CodeLineRange`        |
| `immerslides/flow-node`        | `FlowNode`, `FlowNodeProps`, `FlowStatus`, `FlowTone`             |
| `immerslides/flow-connector`   | `FlowConnector`, `FlowConnectorProps`, `FlowStatus`               |
| `immerslides/timeline`         | `Timeline`, `TimelineProps`, `TimelineItem`, `TimelineStep`       |
| `immerslides/step-description` | `StepDescription`, `StepDescriptionProps`                         |
| `immerslides/slide-frame`      | `SlideFrame`, `SlideFrameProps`                                   |
| `immerslides/chapter-guide`    | `ChapterGuide`                                                    |
| `immerslides/slide-preview`    | `SlidePreview`, `SlidePreviewProps`                               |
| `immerslides/slide-navigator`  | `SlideNavigator`                                                  |
| `immerslides/player`           | `Player`                                                          |
| `immerslides/site`             | `Site`, `SiteProps`, `SiteStory`, `SiteStoryProps`, `getSiteHref` |
| `immerslides/deck`             | `defineDeck` and the slide types                                  |

Using `CodeWindow` alone does not load highlight.js. Static previews and the basic flow components do not load the playback core. The root entry still exports the same components and types. Import `immerslides/styles.css` once for the styles.

## Building blocks

| Component         | Responsibility                                | Main inputs                                      |
| ----------------- | --------------------------------------------- | ------------------------------------------------ |
| `CodeWindow`      | Dark window, file name, and frame             | `filename?`, `children`                          |
| `HighlightedCode` | Syntax highlighting, line focus, scrolling    | raw string, `language?`, `focus?`, `still?`      |
| `StepDescription` | Section title, content, and progress text     | `title`, zero-based `step`, `count`, `children?` |
| `FlowNode`        | Node with custom content and a semantic state | `title`, `children?`, `status?`, `tone?`         |
| `FlowConnector`   | Connector that shows the flow state           | `status?`                                        |

`CodeBlock` and `Timeline` are ready-made layouts built from these components. When a layout fits, use it directly instead of rewriting the same focus or highlighting logic.

## Custom code and descriptions

The snippet below continues from `source` and `codeSteps`, which are defined in [immersive.md](immersive.md). Put it inside a slide renderer's content.

```tsx
import { CodeWindow } from 'immerslides/code-window';
import { HighlightedCode } from 'immerslides/highlighted-code';
import { StepDescription } from 'immerslides/step-description';
import type { SlideRenderProps } from 'immerslides/deck';

function CustomCodeScene({ step, still }: SlideRenderProps) {
  const current = codeSteps[step];
  return (
    <div>
      <StepDescription
        title={current.title}
        step={step}
        count={codeSteps.length}
      >
        <p>{current.detail}</p>
      </StepDescription>
      <CodeWindow filename="load-user.ts">
        <HighlightedCode language="ts" focus={current.lines} still={still}>
          {source}
        </HighlightedCode>
      </CodeWindow>
    </div>
  );
}
```

This example places the description above the code. You can use your own CSS Grid or Flex to arrange them side by side, or add images and other JSX content. The focused range still comes from the same `codeSteps`.

## Custom nodes

`FlowStatus` is `active`, `complete`, or `idle`. Without a `status`, the node stays in its normal static appearance. A node's title and content can be React elements.

```tsx
import { FlowNode } from 'immerslides/flow-node';
import { FlowConnector } from 'immerslides/flow-connector';

function CustomFlow({ step }: { step: number }) {
  return (
    <div className="my-flow" aria-label="Request handling flow">
      <FlowNode title="Request" status={step === 0 ? 'active' : 'complete'}>
        <p>Receive the user's input.</p>
      </FlowNode>
      <FlowConnector status={step === 0 ? 'active' : 'complete'} />
      <FlowNode
        title={<span>Validate and respond</span>}
        status={step === 1 ? 'active' : 'idle'}
      >
        <p>Check the conditions, then return the result.</p>
      </FlowNode>
    </div>
  );
}
```

Arrange the nodes and connectors yourself. The starter's `Composition` scene and `src/styles.css` contain complete examples of a vertical flow next to code. `FlowConnector` is a visual connector. It does not provide automatic diagram layout or routing.

## Keep one set of step data

A slide's `steps` uses the `length` of the section array. Code, flow nodes, and descriptions all read the renderer's `step`. Do not record the teaching position separately with `useState` in each component.

Pass `still` to `HighlightedCode`. Built-in components placed inside `SlideFrame` follow the static preview and reduced-motion styles.
