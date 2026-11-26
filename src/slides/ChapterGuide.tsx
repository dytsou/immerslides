import type { CSSProperties } from 'react';
import type { StageOverlayProps } from '../presentation/types.js';
import { ChapterRail } from './ChapterRail.js';

export function ChapterGuide({
  deck,
  slide,
  viewport,
  scale,
  actions,
}: StageOverlayProps) {
  const style: CSSProperties = {
    left: (viewport.width - deck.size.width * scale) / 2 + 48 * scale,
    top: (viewport.height - deck.size.height * scale) / 2 + 330 * scale,
    transform: `scale(${scale})`,
  };
  return (
    <div className="immerslides-guide-overlay" style={style}>
      <ChapterRail deck={deck} slide={slide} onJump={actions.jump} />
    </div>
  );
}
