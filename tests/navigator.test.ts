import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  groupSlides,
  SlideNavigator,
} from '../src/presentation/SlideNavigator';
import {
  defineDeck,
  type SlideId,
  type SlideNavigatorProps,
} from '../src/presentation/types';

const deck = defineDeck({
  id: 'navigator',
  title: 'Navigator',
  size: { width: 1600, height: 900 },
  slides: [
    { id: 0, title: 'Cover', steps: 1 },
    { id: 'intro', title: 'Introduction', steps: 1 },
    { id: 'code', title: 'Code', steps: 3 },
    { id: 'end', title: 'Ending', steps: 1 },
  ],
  chapters: [
    { id: 'learn', title: 'Learning', slideId: 'intro' },
    { id: 'finish', title: 'Finish', slideId: 'end' },
  ],
  previews: [],
  RenderSlide: () => null,
});

describe('chapter slide groups', () => {
  it('keeps prechapter slides and chapter ranges in presentation order exactly once', () => {
    const groups = groupSlides(deck);
    expect(
      groups.map((group) => ({
        title: group.title,
        pages: group.slides.map(({ slide, index }) => [slide.id, index + 1]),
      })),
    ).toEqual([
      { title: '投影片', pages: [[0, 1]] },
      {
        title: 'Learning',
        pages: [
          ['intro', 2],
          ['code', 3],
        ],
      },
      { title: 'Finish', pages: [['end', 4]] },
    ]);
  });

  it('shows every slide without chapter metadata and avoids an empty prechapter group', () => {
    for (const chapters of [undefined, []]) {
      const groups = groupSlides({ ...deck, chapters });
      expect(groups.map((group) => group.title)).toEqual(['投影片']);
      expect(groups[0].slides.map(({ slide }) => slide.id)).toEqual([
        0,
        'intro',
        'code',
        'end',
      ]);
    }
    const groups = groupSlides({
      ...deck,
      chapters: [{ id: 'all', title: 'Whole deck', slideId: 0 }],
    });
    expect(groups.map((group) => group.title)).toEqual(['Whole deck']);
    expect(groups[0].slides).toHaveLength(4);
  });

  it('renders unassigned slides directly and creates headings only for authored chapters', () => {
    const render = (chapters: typeof deck.chapters | undefined) =>
      renderToStaticMarkup(
        createElement(SlideNavigator, {
          deck: { ...deck, chapters },
          selectedId: 0,
          onSelect() {},
          view: 'outline',
          onViewChange() {},
          filter: 'all',
          onFilterChange() {},
        }),
      );
    const plain = render(undefined);
    expect(plain).not.toContain('<details');
    expect(plain).not.toContain('<summary');
    expect(plain).not.toContain('未分章');
    expect(plain).not.toContain('全部投影片');
    expect(plain).toContain('Cover');
    expect(plain).toContain('Ending');
    const grouped = render(deck.chapters);
    expect(grouped.match(/<summary/g)).toHaveLength(2);
    expect(grouped.indexOf('Cover')).toBeLessThan(grouped.indexOf('<summary'));
  });

  it('filters marked pages without changing page numbers and removes empty chapters', () => {
    const groups = groupSlides(deck, new Set(['code', 0]));
    expect(
      groups.map((group) => ({
        title: group.title,
        pages: group.slides.map(({ slide, index }) => [slide.id, index + 1]),
      })),
    ).toEqual([
      { title: '投影片', pages: [[0, 1]] },
      { title: 'Learning', pages: [['code', 3]] },
    ]);
    expect(groupSlides(deck, new Set())).toEqual([]);
    expect(groupSlides(deck, new Set(['missing']))).toEqual([]);
  });

  it('offers marked filtering only when a marks source is supplied', () => {
    const props: SlideNavigatorProps = {
      deck,
      selectedId: 0,
      onSelect() {},
      view: 'outline',
      onViewChange() {},
      filter: 'marked',
      onFilterChange() {},
    };
    const plain = renderToStaticMarkup(createElement(SlideNavigator, props));
    expect(plain).not.toContain('aria-label="頁面篩選"');
    expect(plain).toContain('Cover');
    const empty = renderToStaticMarkup(
      createElement(SlideNavigator, {
        ...props,
        markedSlides: new Set<SlideId>(),
      }),
    );
    expect(empty).toContain('aria-label="頁面篩選"');
    expect(empty).toContain('還沒有標記頁面');
    expect(empty).not.toContain('data-target=');
    expect(empty).not.toContain('<summary');
    const marked = renderToStaticMarkup(
      createElement(SlideNavigator, {
        ...props,
        markedSlides: new Set<SlideId>(['code']),
        onToggleMark() {},
      }),
    );
    expect(marked).toContain('取消標記頁面：Code（第 3 頁）');
    expect(marked).toContain('aria-pressed="true"');
  });
});
