import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/context.js';
import { defaultLocale, messages } from '../i18n/messages.js';
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
  ungroupedTitle = messages[defaultLocale]['navigator.ungrouped'],
): SlideGroup[] {
  const groups: SlideGroup[] = [];
  let chapterIndex = 0;
  for (const [index, slide] of deck.slides.entries()) {
    const chapter = deck.chapters?.[chapterIndex];
    if (chapter?.slideId === slide.id) {
      groups.push({ id: chapter.id, title: chapter.title, slides: [] });
      chapterIndex++;
    }
    if (!groups.length)
      groups.push({ id: null, title: ungroupedTitle, slides: [] });
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
  const { t } = useI18n();
  const groups = groupSlides(
    deck,
    filter === 'marked' ? markedSlides : undefined,
    t('navigator.ungrouped'),
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
              aria-label={
                markedSlides.has(slide.id)
                  ? t('navigator.unmark', {
                      title: slide.title,
                      page: index + 1,
                    })
                  : t('navigator.mark', { title: slide.title, page: index + 1 })
              }
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
      aria-label={t('navigator.label')}
    >
      <div className="navigator-toolbar">
        <div
          className="navigator-view"
          role="group"
          aria-label={t('navigator.view')}
        >
          <button
            type="button"
            aria-pressed={view === 'outline'}
            onClick={() => onViewChange('outline')}
          >
            {t('navigator.outline')}
          </button>
          <button
            type="button"
            aria-pressed={view === 'thumbnails'}
            onClick={() => onViewChange('thumbnails')}
          >
            {t('navigator.thumbnails')}
          </button>
        </div>
        {markedSlides && (
          <div
            className="navigator-view"
            role="group"
            aria-label={t('navigator.filter')}
          >
            <button
              type="button"
              aria-pressed={filter === 'all'}
              onClick={() => onFilterChange('all')}
            >
              {t('navigator.all')}
            </button>
            <button
              ref={markedFilter}
              type="button"
              aria-pressed={filter === 'marked'}
              onClick={() => onFilterChange('marked')}
            >
              {t('navigator.marked')}
            </button>
          </div>
        )}
      </div>
      <ol
        ref={list}
        className="navigator-groups"
        aria-label={t('navigator.list')}
      >
        {groups.map((group) => (
          <li key={group.id === null ? 'unassigned' : `chapter:${group.id}`}>
            {group.id === null ? (
              slides(group)
            ) : (
              <details className="navigator-group" open>
                <summary className="navigator-summary">
                  <span>{group.title}</span>
                  <span className="navigator-count">
                    {t('navigator.count', { count: group.slides.length })}
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
          {t('navigator.empty')}
        </p>
      )}
    </nav>
  );
}
