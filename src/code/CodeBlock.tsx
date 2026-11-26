import { StepDescription } from '../walkthrough/StepDescription.js';
import { selectedStep } from '../walkthrough/selectedStep.js';
import { CodeWindow } from './CodeWindow.js';
import { HighlightedCode } from './HighlightedCode.js';
import { type CodeLineRange, validateCodeRanges } from './highlighting.js';

export type { CodeLineRange } from './highlighting.js';
export type CodeStep = {
  title: string;
  detail?: string;
  lines: readonly CodeLineRange[];
};
export type CodeBlockProps = {
  children: string;
  filename?: string;
  language?: string;
  steps?: readonly CodeStep[];
  step?: number;
  still?: boolean;
};

export function CodeBlock({
  children,
  filename,
  language,
  steps,
  step = 0,
  still = false,
}: CodeBlockProps) {
  const focus = selectedStep(steps, step);
  if (steps) {
    const lineCount = children.split('\n').length;
    for (const entry of steps) validateCodeRanges(entry.lines, lineCount);
  }
  const code = (
    <CodeWindow filename={filename}>
      <HighlightedCode language={language} focus={focus?.lines} still={still}>
        {children}
      </HighlightedCode>
    </CodeWindow>
  );
  return focus ? (
    <div
      className="immerslides-walkthrough immerslides-code-walkthrough"
      data-step={step}
      data-still={still || undefined}
    >
      {code}
      <StepDescription title={focus.title} step={step} count={steps!.length}>
        {focus.detail}
      </StepDescription>
    </div>
  ) : (
    code
  );
}
