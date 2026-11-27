import { Fragment, useEffect, useMemo, useRef } from 'react';
import { useI18n } from '../i18n/context.js';
import { useReducedMotion } from '../presentation/useReducedMotion.js';
import {
  type CodeLineRange,
  highlightLines,
  validateCodeRanges,
} from './highlighting.js';

export type { CodeLineRange } from './highlighting.js';
export type HighlightedCodeProps = {
  children: string;
  language?: string;
  focus?: readonly CodeLineRange[];
  still?: boolean;
};

export function HighlightedCode({
  children,
  language,
  focus,
  still = false,
}: HighlightedCodeProps) {
  const lines = useMemo(
    () => highlightLines(children, language),
    [children, language],
  );
  if (focus) validateCodeRanges(focus, lines.length);
  const pre = useRef<HTMLPreElement>(null);
  const reducedMotion = useReducedMotion();
  const { t } = useI18n();
  useEffect(() => {
    const element = pre.current;
    const first = element?.querySelector<HTMLElement>('[data-focused="true"]');
    if (!element || !first) return;
    const top =
      first.offsetTop + Number.parseFloat(getComputedStyle(element).paddingTop);
    const end = Math.max(...focus!.map(([, end]) => end));
    const last = element.querySelector<HTMLElement>(`[data-line="${end}"]`)!;
    const height = last.offsetTop + last.offsetHeight - first.offsetTop;
    const scrollTop = Math.max(
      0,
      top - Math.max(0, (element.clientHeight - height) / 2),
    );
    element.scrollTo({
      top: scrollTop,
      behavior: still || reducedMotion ? 'instant' : 'smooth',
    });
  }, [focus, still, reducedMotion, children]);
  return (
    <pre
      role="region"
      className="immerslides-code-content"
      data-language={language}
      data-still={still || undefined}
      ref={pre}
      tabIndex={0}
      aria-label={t('code.label')}
    >
      <code>
        {focus?.map(([start, end], index) => (
          <span
            key={index}
            className="immerslides-code-focus"
            aria-hidden
            style={{
              transform: `translateY(${(start - 1) * 1.6}em)`,
              height: `${(end - start + 1) * 1.6}em`,
            }}
          />
        ))}
        {lines.map((tokens, lineIndex) => {
          const number = lineIndex + 1;
          const focused = focus?.some(
            ([start, end]) => number >= start && number <= end,
          );
          return (
            <Fragment key={number}>
              <span
                className="immerslides-code-line"
                data-line={number}
                data-focused={focused}
              >
                {tokens.map((token, tokenIndex) => (
                  <span key={tokenIndex} className={token.className}>
                    {token.text}
                  </span>
                ))}
              </span>
              {lineIndex < lines.length - 1 ? '\n' : null}
            </Fragment>
          );
        })}
      </code>
    </pre>
  );
}
