import type { ReactNode } from 'react';

export type StepDescriptionProps = {
  title: string;
  step: number;
  count: number;
  children?: ReactNode;
};

export function StepDescription({
  title,
  children,
  step,
  count,
}: StepDescriptionProps) {
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    !Number.isInteger(step) ||
    step < 0 ||
    step >= count
  )
    throw new Error(
      'Step descriptions need a positive count and an in-range integer step.',
    );
  return (
    <aside
      className="immerslides-step-explanation"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="immerslides-label">
        {String(step + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
      </span>
      <div className="immerslides-step-copy" key={step}>
        <h2>{title}</h2>
        {children && <div className="immerslides-step-detail">{children}</div>}
      </div>
    </aside>
  );
}
