import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSlideRoutes,
  getSlideHref,
  parseSlideHash,
} from '../src/presentation/routing';
import { initialState, readProgress, reduce } from '../src/presentation/state';
import { type DeckDefinition, defineDeck } from '../src/presentation/types';

const deck = defineDeck({
  id: 'routes',
  title: 'Routes',
  size: { width: 1600, height: 900 },
  slides: [
    { id: 'intro', title: 'Hello, World!', steps: 1 },
    {
      id: 'code',
      title: '程式碼，逐段講解',
      slug: 'Code Walkthrough',
      steps: 3,
    },
    { id: 0, title: 'ＡＰＩ / Café & 資料', steps: 2 },
  ],
  chapters: [
    { id: 'learn', title: '開始學習', slug: 'Learning', slideId: 'code' },
  ],
  previews: [],
  RenderSlide: () => null,
});

afterEach(() => vi.unstubAllGlobals());

describe('slide links', () => {
  it('normalizes titles and explicit slugs while preserving Unicode', () => {
    expect(getSlideHref(deck, 'intro')).toBe('#/hello-world');
    expect(getSlideHref(deck, 'code', 1)).toBe('#/code-walkthrough?step=2');
    expect(getSlideHref(deck, 0)).toBe('#/api-caf%C3%A9-%E8%B3%87%E6%96%99');
    expect(getSlideHref(deck, 'code', 50)).toBe('#/code-walkthrough?step=3');
    expect(() => getSlideHref(deck, 'missing')).toThrow();
    for (const step of [-1, 1.5, Infinity])
      expect(() => getSlideHref(deck, 'code', step)).toThrow();
  });

  it('accepts title, ID, and chapter aliases at the chapter start slide', () => {
    const routes = createSlideRoutes(deck);
    for (const hash of [
      '#/code-walkthrough',
      '#/CODE Walkthrough!',
      '#/code',
      '#/程式碼-逐段講解',
      '#/learning',
      '#/learn',
      '#/開始學習',
    ])
      expect(parseSlideHash(routes, hash)).toEqual({
        slideId: 'code',
        step: 0,
      });
    expect(parseSlideHash(routes, '#/api-café-資料?step=2')).toEqual({
      slideId: 0,
      step: 1,
    });
  });

  it('resolves numeric routes by one based position rather than numeric slide ID', () => {
    const numbered = {
      ...deck,
      chapters: [],
      slides: [
        { id: 15, title: 'First', steps: 1 },
        { id: 1, title: 'Second', steps: 3 },
        { id: 200, title: 'Third', steps: 1 },
      ],
    };
    const routes = createSlideRoutes(numbered);
    expect(parseSlideHash(routes, '#/1')).toEqual({ slideId: 15, step: 0 });
    expect(parseSlideHash(routes, '#/2?step=2')).toEqual({
      slideId: 1,
      step: 1,
    });
    expect(parseSlideHash(routes, '#/3')).toEqual({ slideId: 200, step: 0 });
    for (const value of [
      '0',
      '-1',
      '1.5',
      '4',
      '15',
      '200',
      '9007199254740992',
      '+2',
      '2e0',
    ])
      expect(parseSlideHash(routes, `#/${value}`)).toBeNull();
  });

  it('reserves numeric slugs and keeps numeric derived titles and IDs addressable', () => {
    const numbered = {
      ...deck,
      chapters: [],
      slides: [
        { id: 99, title: '15', steps: 1 },
        { id: 42, title: '!!!', steps: 1 },
      ],
    };
    expect(getSlideHref(numbered, 99)).toBe('#/slide-15');
    expect(getSlideHref(numbered, 42)).toBe('#/slide-42');
    expect(parseSlideHash(createSlideRoutes(numbered), '#/15')).toBeNull();
    expect(parseSlideHash(createSlideRoutes(numbered), '#/1')).toEqual({
      slideId: 99,
      step: 0,
    });
    expect(() =>
      defineDeck({
        ...deck,
        slides: [{ id: 'a', title: 'One', slug: '15', steps: 1 }],
        chapters: [],
      }),
    ).toThrow(/reserved/);
    expect(() =>
      defineDeck({
        ...deck,
        chapters: [{ id: 'a', title: 'One', slideId: 'intro', slug: '２' }],
      }),
    ).toThrow(/reserved/);
    const decimalTitle = {
      ...deck,
      chapters: [],
      slides: [{ id: 'decimal', title: '1.5', steps: 1 }],
    };
    expect(getSlideHref(decimalTitle, 'decimal')).toBe('#/1-5');
    expect(parseSlideHash(createSlideRoutes(decimalTitle), '#/1.5')).toEqual({
      slideId: 'decimal',
      step: 0,
    });
  });

  it('roundtrips alphanumeric titles and explicit slugs that JavaScript can parse as numbers', () => {
    const named = {
      ...deck,
      chapters: [],
      slides: [
        { id: 'scientific', title: '1e1', steps: 1 },
        { id: 'hexadecimal', title: 'Hexadecimal', slug: '0x10', steps: 1 },
      ],
    };
    expect(getSlideHref(named, 'scientific')).toBe('#/1e1');
    expect(getSlideHref(named, 'hexadecimal')).toBe('#/0x10');
    const routes = createSlideRoutes(named);
    expect(parseSlideHash(routes, '#/1e1')).toEqual({
      slideId: 'scientific',
      step: 0,
    });
    expect(parseSlideHash(routes, '#/0x10')).toEqual({
      slideId: 'hexadecimal',
      step: 0,
    });
  });

  it('gives repeated titles stable ID suffixes and omits ambiguous aliases', () => {
    const repeated = {
      ...deck,
      chapters: [],
      slides: [
        { id: 'first', title: 'Details', steps: 1 },
        { id: 'second', title: 'Details!', steps: 1 },
      ],
    };
    expect(getSlideHref(repeated, 'first')).toBe('#/details-first');
    expect(getSlideHref(repeated, 'second')).toBe('#/details-second');
    expect(
      getSlideHref(
        { ...repeated, slides: [...repeated.slides].reverse() },
        'first',
      ),
    ).toBe('#/details-first');
    expect(parseSlideHash(createSlideRoutes(repeated), '#/details')).toBeNull();
    const collidingIds = {
      ...repeated,
      slides: [
        { id: 'A', title: 'Details', steps: 1 },
        { id: 'a', title: 'Details', steps: 1 },
      ],
    };
    const links = collidingIds.slides.map((slide) =>
      getSlideHref(collidingIds, slide.id),
    );
    expect(new Set(links).size).toBe(2);
    for (const [index, href] of links.entries())
      expect(
        parseSlideHash(createSlideRoutes(collidingIds), href)?.slideId,
      ).toBe(collidingIds.slides[index].id);
  });

  it('rejects explicit collisions and empty slugs, and resolves derived chapter collisions', () => {
    const withSlides = (slides: DeckDefinition['slides']) => ({
      ...deck,
      chapters: [],
      slides,
    });
    expect(() =>
      defineDeck(
        withSlides([
          { id: 'a', title: 'One', slug: 'Same!', steps: 1 },
          { id: 'b', title: 'Two', slug: 'same', steps: 1 },
        ]),
      ),
    ).toThrow(/Duplicate/);
    expect(() =>
      defineDeck({
        ...deck,
        chapters: [
          {
            id: 'conflict',
            title: 'Conflict',
            slug: 'code walkthrough',
            slideId: 'intro',
          },
        ],
      }),
    ).toThrow(/Duplicate/);
    expect(() =>
      defineDeck(
        withSlides([{ id: 'a', title: 'One', slug: '!!!', steps: 1 }]),
      ),
    ).toThrow(/Slugs/);
    const repeatedChapters = {
      ...deck,
      chapters: [
        { id: 'one', title: 'Shared chapter', slideId: 'intro' },
        { id: 'two', title: 'Shared chapter', slideId: 'code' },
      ],
    };
    expect(
      parseSlideHash(createSlideRoutes(repeatedChapters), '#/shared-chapter'),
    ).toBeNull();
    const reserved = {
      ...deck,
      chapters: [
        { id: 'first', title: 'Start', slug: 'Hello World', slideId: 'code' },
      ],
    };
    expect(getSlideHref(reserved, 'intro')).toBe('#/hello-world-intro');
    expect(
      parseSlideHash(createSlideRoutes(reserved), '#/hello-world')?.slideId,
    ).toBe('code');
  });

  it('rejects malformed or unknown routes and bounds human numbered steps', () => {
    const routes = createSlideRoutes(deck);
    for (const hash of ['', '#intro', '#/', '#/missing', '#/%', '#/%E0%A4%A'])
      expect(parseSlideHash(routes, hash)).toBeNull();
    for (const query of [
      '',
      '?step=',
      '?step=0',
      '?step=-1',
      '?step=1.5',
      '?step=words',
      '?step=2&step=3',
      '?step=99999999999999999999',
    ])
      expect(parseSlideHash(routes, `#/code${query}`)).toEqual({
        slideId: 'code',
        step: 0,
      });
    expect(parseSlideHash(routes, '#/code?step=2')).toEqual({
      slideId: 'code',
      step: 1,
    });
    expect(parseSlideHash(routes, '#/code?step=999')).toEqual({
      slideId: 'code',
      step: 2,
    });
    expect(parseSlideHash(routes, '#/intro?step=999')).toEqual({
      slideId: 'intro',
      step: 0,
    });
  });
});

describe('URL progress boundary', () => {
  const saved = {
    ...initialState(deck),
    slideId: 'code',
    step: 2,
    generation: 4,
  };
  const location = (hash: string) => {
    vi.stubGlobal('location', { hash });
    vi.stubGlobal('sessionStorage', { getItem: () => JSON.stringify(saved) });
  };

  it('prioritizes valid URLs over fresh and saved progress', () => {
    location('#/code?step=2');
    for (const fresh of [false, true])
      expect(readProgress(deck, fresh)).toEqual({
        ...initialState(deck),
        slideId: 'code',
        step: 1,
      });
  });

  it('uses fresh or saved progress only without an owned URL', () => {
    for (const hash of ['', '#external-section']) {
      location(hash);
      expect(readProgress(deck, false)).toEqual(saved);
      expect(readProgress(deck, true)).toEqual(initialState(deck));
    }
    for (const hash of ['#/missing', '#/%E0%A4%A']) {
      location(hash);
      expect(readProgress(deck, false)).toEqual(initialState(deck));
    }
  });

  it('applies URL navigation in the reducer without resetting generation or changing jump behavior', () => {
    expect(
      reduce(deck, saved, {
        type: 'navigate',
        target: { slideId: 0, step: 1 },
      }),
    ).toEqual({ ...saved, slideId: 0, step: 1 });
    expect(reduce(deck, saved, { type: 'jump', id: 'code' })).toEqual({
      ...saved,
      step: 0,
    });
  });
});
