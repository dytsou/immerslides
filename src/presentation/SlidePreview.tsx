import { useLayoutEffect, useRef, useState } from 'react';
import { SiteContext } from '../site/context.js';
import { inertActions } from './inertActions.js';
import type { DeckDefinition, SlideId } from './types.js';

export type SlidePreviewProps = {
  deck: DeckDefinition;
  slideId: SlideId;
  step?: number;
};

/** Shares the slide renderer, never a playback store, provider, or timer. */
export function SlidePreview({ deck, slideId, step }: SlidePreviewProps) {
  const slide = deck.slides.find((slide) => slide.id === slideId)!;
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const element = frame.current!;
    const measure = () => setScale(element.clientWidth / deck.size.width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [deck.size.width]);
  return (
    <div
      className="immerslides-preview"
      data-deck={deck.id}
      ref={frame}
      style={{ aspectRatio: `${deck.size.width}/${deck.size.height}` }}
      aria-hidden
      inert
    >
      <div
        className="preview-canvas"
        style={{
          width: deck.size.width,
          height: deck.size.height,
          transform: `scale(${scale})`,
          visibility: scale ? undefined : 'hidden',
        }}
      >
        <SiteContext.Provider value={null}>
          <deck.RenderSlide
            slide={slide}
            step={step ?? slide.steps - 1}
            mode="preview"
            still
            active={false}
            reducedMotion
            actions={inertActions}
          />
        </SiteContext.Provider>
      </div>
    </div>
  );
}
