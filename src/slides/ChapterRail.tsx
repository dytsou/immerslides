import type {
  DeckDefinition,
  SlideDefinition,
  StageOverlayProps,
} from '../presentation/types.js';

export function chapterPosition(deck: DeckDefinition, slide: SlideDefinition) {
  const index = deck.slides.findIndex((item) => item.id === slide.id);
  return (deck.chapters ?? []).findLastIndex(
    (chapter) =>
      deck.slides.findIndex((item) => item.id === chapter.slideId) <= index,
  );
}

export function ChapterRail({
  deck,
  slide,
  onJump,
}: {
  deck: DeckDefinition;
  slide: SlideDefinition;
  onJump?: StageOverlayProps['actions']['jump'];
}) {
  const chapters = deck.chapters ?? [];
  const current = chapterPosition(deck, slide);
  return (
    <nav className="immerslides-rail" aria-label="章節進度">
      <div className="immerslides-rail-window">
        <ol style={{ transform: `translateY(${80 - current * 80}px)` }}>
          {chapters.map((chapter, index) => (
            <li
              key={chapter.id}
              aria-current={index === current ? 'step' : undefined}
            >
              <button
                type="button"
                disabled={!onJump}
                tabIndex={onJump && Math.abs(index - current) <= 1 ? 0 : -1}
                onClick={() => onJump?.(chapter.slideId)}
              >
                <span
                  className="immerslides-rail-label"
                  style={{
                    transform: `scale(${index === current ? 1 : 0.78})`,
                    opacity:
                      index === current
                        ? 1
                        : Math.abs(index - current) <= 1
                          ? 0.5
                          : 0.2,
                  }}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <b>{chapter.title}</b>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
