import type { ReactNode } from 'react';
import type { DeckDefinition, SlideDefinition } from '../presentation/types.js';
import { ChapterRail, chapterPosition } from './ChapterRail.js';

export type SlideFrameProps = {
  deck: DeckDefinition;
  slide: SlideDefinition;
  layout?: 'content' | 'cover' | 'ending';
  footer?: ReactNode;
  still?: boolean;
  mode?: 'playback' | 'preview';
  children: ReactNode;
};

export function SlideFrame({
  deck,
  slide,
  layout = 'content',
  footer = deck.title,
  still = false,
  mode = 'playback',
  children,
}: SlideFrameProps) {
  const index = deck.slides.findIndex((item) => item.id === slide.id);
  const chapters = deck.chapters ?? [];
  const chapterIndex = chapterPosition(deck, slide);
  const chapter = chapters[chapterIndex];
  const rail = layout === 'content' && chapter;
  return (
    <section
      className={`immerslides-slide ${layout} ${rail ? 'with-rail' : ''}`}
      data-still={still || undefined}
      data-mode={mode}
      data-slide={slide.id}
      aria-label={slide.title}
    >
      {rail && <ChapterRail deck={deck} slide={slide} />}
      {layout === 'content' && (
        <header className="immerslides-heading">
          <p>{chapter?.title ?? deck.title}</p>
          <h1>{slide.title}</h1>
        </header>
      )}
      <div className="immerslides-body">{children}</div>
      <footer className="immerslides-footer">
        <span>{footer}</span>
        <span>
          {index + 1} / {deck.slides.length}
        </span>
      </footer>
    </section>
  );
}
