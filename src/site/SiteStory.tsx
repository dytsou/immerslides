import { type ReactNode, useContext } from 'react';
import { SiteContext } from './context.js';

export type SiteStoryProps = {
  steps: readonly { title: string; detail?: ReactNode }[];
  step: number;
  children: ReactNode;
};

const label = (value: number) => String(value).padStart(2, '0');

export function SiteStory({ steps, step, children }: SiteStoryProps) {
  const motion = useContext(SiteContext);
  if (!motion) return children;
  return (
    <div className="immersite-story" data-step={step}>
      {children}
      {motion === 'reduced' && (
        <ol className="immersite-story-steps">
          {steps.map((entry, index) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: steps are a fixed, ordered list.
              key={index}
              aria-current={index === step ? 'step' : undefined}
            >
              <span className="immerslides-label">
                {label(index + 1)} / {label(steps.length)}
              </span>
              <h2>{entry.title}</h2>
              {entry.detail && (
                <div className="immerslides-step-detail">{entry.detail}</div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
