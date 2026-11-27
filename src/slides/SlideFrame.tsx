import type { ReactNode } from 'react';
import { useI18n } from '../i18n/context.js';
import { localizeDeck } from '../i18n/deck.js';
import type {
  DeckDefinition,
  PresentationActions,
  SlideDefinition,
} from '../presentation/types.js';
import { ChapterRail, chapterPosition } from './ChapterRail.js';

export type SlideFrameProps = {
  deck: DeckDefinition;
  slide: SlideDefinition;
  layout?: 'content' | 'cover' | 'ending';
  footer?: ReactNode;
  still?: boolean;
  mode?: 'playback' | 'preview';
  actions?: PresentationActions;
  children: ReactNode;
};

export function SlideFrame({
  deck: source,
  slide,
  layout = 'content',
  footer,
  still = false,
  mode = 'playback',
  actions,
  children,
}: SlideFrameProps) {
  const { locale } = useI18n();
  const deck = localizeDeck(source, locale);
  const index = deck.slides.findIndex((item) => item.id === slide.id);
  const title = deck.slides[index]?.title ?? slide.title;
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
      aria-label={title}
    >
      {rail && <ChapterRail deck={deck} slide={slide} onJump={actions?.jump} />}
      {layout === 'content' && (
        <header className="immerslides-heading">
          <p>{chapter?.title ?? deck.title}</p>
          <h1>{title}</h1>
        </header>
      )}
      <div className="immerslides-body">{children}</div>
      <footer className="immerslides-footer">
        <span>{footer === undefined ? deck.title : footer}</span>
        <span>
          {index + 1} / {deck.slides.length}
        </span>
      </footer>
    </section>
  );
}
