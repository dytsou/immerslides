import { StepDescription } from '../walkthrough/StepDescription.js';
import { selectedStep } from '../walkthrough/selectedStep.js';
import { FlowConnector } from './FlowConnector.js';
import { FlowNode } from './FlowNode.js';
import type { FlowTone } from './types.js';

export type TimelineItem = {
  id?: string;
  title: string;
  detail?: string;
  tone?: FlowTone;
};
export type TimelineStep = {
  title: string;
  detail?: string;
  nodes: readonly string[];
};
export type TimelineProps = {
  items: readonly TimelineItem[];
  steps?: readonly TimelineStep[];
  step?: number;
  still?: boolean;
};

export function Timeline({
  items,
  steps,
  step = 0,
  still = false,
}: TimelineProps) {
  if (items.length < 1 || items.length > 3)
    throw new Error(
      'A timeline needs one to three nodes. Split longer flows across pages.',
    );
  const focus = selectedStep(steps, step);
  if (steps) {
    const ids = items.map((item) => item.id);
    if (ids.some((id) => !id?.trim()) || new Set(ids).size !== ids.length)
      throw new Error('Timeline walkthroughs need unique, nonempty node IDs.');
    for (const entry of steps)
      if (
        !entry.nodes.length ||
        new Set(entry.nodes).size !== entry.nodes.length ||
        entry.nodes.some((id) => !ids.includes(id))
      )
        throw new Error('Timeline steps must name existing, distinct nodes.');
  }
  const focusedNodes =
    focus?.nodes.map((id) => items.findIndex((node) => node.id === id)) ?? [];
  const timeline = (
    <ol
      className="immerslides-timeline"
      data-walkthrough={focus ? true : undefined}
    >
      {items.map((item, index) => (
        <li
          key={item.id ?? index}
          data-node={item.id}
          data-focused={focus ? focus.nodes.includes(item.id!) : undefined}
        >
          {index < items.length - 1 && (
            <FlowConnector
              status={
                focus &&
                focusedNodes.some(
                  (node) => node === index || node === index + 1,
                )
                  ? 'active'
                  : 'idle'
              }
            />
          )}
          <FlowNode
            title={item.title}
            tone={item.tone}
            status={
              focus
                ? focus.nodes.includes(item.id!)
                  ? 'active'
                  : 'idle'
                : undefined
            }
          >
            {item.detail}
          </FlowNode>
        </li>
      ))}
    </ol>
  );
  return focus ? (
    <div
      className="immerslides-walkthrough immerslides-flow-walkthrough"
      data-step={step}
      data-still={still || undefined}
    >
      <div>{timeline}</div>
      <StepDescription title={focus.title} step={step} count={steps!.length}>
        {focus.detail}
      </StepDescription>
    </div>
  ) : (
    timeline
  );
}
