import { useEffect, useRef } from 'react';
import { SlidePreview } from './SlidePreview.js';
import type {
  DeckDefinition,
  SlideDefinition,
  SlideId,
  SlideNavigatorProps,
} from './types.js';

type SlideGroup = {
  id: string | null;
  title: string;
  slides: { slide: SlideDefinition; index: number }[];
};

export function groupSlides(
  deck: DeckDefinition,
  included?: ReadonlySet<SlideId>,
): SlideGroup[] {
  const groups: SlideGroup[] = [];
  let chapterIndex = 0;
  for (const [index, slide] of deck.slides.entries()) {
    const chapter = deck.chapters?.[chapterIndex];
    if (chapter?.slideId === slide.id) {
      groups.push({ id: chapter.id, title: chapter.title, slides: [] });
      chapterIndex++;
    }
    if (!groups.length) groups.push({ id: null, title: '投影片', slides: [] });
    if (!included || included.has(slide.id))
      groups.at(-1)!.slides.push({ slide, index });
  }
  return groups.filter((group) => group.slides.length);
}

export function SlideNavigator({
  deck,
  selectedId,
  onSelect,
  view,
  onViewChange,
  filter,
  onFilterChange,
  markedSlides,
  onToggleMark,
}: SlideNavigatorProps) {
  const selected = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const markedFilter = useRef<HTMLButtonElement>(null);
  const groups = groupSlides(
    deck,
    filter === 'marked' ? markedSlides : undefined,
  );
  useEffect(() => {
    const button = selected.current;
    const container = list.current;
    if (!container) return;
    if (!button) {
      container.scrollTo({ top: 0 });
      return;
    }
    const chapter = button.closest<HTMLDetailsElement>('details');
    if (chapter) chapter.open = true;
    const target = button.closest('li')!.getBoundingClientRect();
    const viewport = container.getBoundingClientRect();
    container.scrollTo({
      top:
        container.scrollTop +
        target.top -
        viewport.top -
        (container.clientHeight - target.height) / 2,
    });
  }, [selectedId, view, filter]);
  const slides = (group: SlideGroup) => (
    <ol
      className={`slide-list${group.id === null ? ' ungrouped' : ''}`}
      aria-label={group.title}
    >
      {group.slides.map(({ slide, index }) => (
        <li
          key={slide.id}
          className={slide.id === selectedId ? 'selected' : undefined}
        >
          {view === 'thumbnails' && (
            <SlidePreview deck={deck} slideId={slide.id} />
          )}
          <button
            ref={slide.id === selectedId ? selected : undefined}
            type="button"
            data-target={slide.id}
            className={slide.id === selectedId ? 'selected' : undefined}
            aria-current={slide.id === selectedId ? 'page' : undefined}
            onClick={() => onSelect(slide.id)}
          >
            <span className="navigator-page">
              {String(index + 1).padStart(2, '0')}
            </span>
            <strong>{slide.title}</strong>
          </button>
          {markedSlides && onToggleMark && (
            <button
              type="button"
              className="navigator-mark"
              aria-pressed={markedSlides.has(slide.id)}
              aria-label={`${markedSlides.has(slide.id) ? '取消標記頁面' : '標記頁面'}：${slide.title}（第 ${index + 1} 頁）`}
              onClick={() => {
                if (filter === 'marked') markedFilter.current?.focus();
                onToggleMark(slide.id);
              }}
            >
              <span aria-hidden>{markedSlides.has(slide.id) ? '★' : '☆'}</span>
            </button>
          )}
        </li>
      ))}
    </ol>
  );
  return (
    <nav
      className="slide-navigator"
      data-view={view}
      data-filter={filter}
      aria-label="投影片導覽"
    >
      <div className="navigator-toolbar">
        <div className="navigator-view" role="group" aria-label="顯示模式">
          <button
            type="button"
            aria-pressed={view === 'outline'}
            onClick={() => onViewChange('outline')}
          >
            文字大綱
          </button>
          <button
            type="button"
            aria-pressed={view === 'thumbnails'}
            onClick={() => onViewChange('thumbnails')}
          >
            縮圖預覽
          </button>
        </div>
        {markedSlides && (
          <div className="navigator-view" role="group" aria-label="頁面篩選">
            <button
              type="button"
              aria-pressed={filter === 'all'}
              onClick={() => onFilterChange('all')}
            >
              全部
            </button>
            <button
              ref={markedFilter}
              type="button"
              aria-pressed={filter === 'marked'}
              onClick={() => onFilterChange('marked')}
            >
              已標記
            </button>
          </div>
        )}
      </div>
      <ol ref={list} className="navigator-groups" aria-label="投影片與章節">
        {groups.map((group) => (
          <li key={group.id === null ? 'unassigned' : `chapter:${group.id}`}>
            {group.id === null ? (
              slides(group)
            ) : (
              <details className="navigator-group" open>
                <summary className="navigator-summary">
                  <span>{group.title}</span>
                  <span className="navigator-count">
                    {group.slides.length} 頁
                  </span>
                </summary>
                {slides(group)}
              </details>
            )}
          </li>
        ))}
      </ol>
      {!groups.length && (
        <p role="status" className="navigator-empty">
          還沒有標記頁面。
        </p>
      )}
    </nav>
  );
}
