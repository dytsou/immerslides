import { describe, expect, it } from 'vitest';
import { createSlideRoutes, getSlideHref } from '../src/presentation/routing';
import { defineDeck } from '../src/presentation/types';
import { getSiteHref, parseSiteHash } from '../src/site/href';
import {
  createTrack,
  positionOf,
  readPosition,
  snapTarget,
} from '../src/site/track';

const viewport = 1000;
const track = createTrack(
  [
    { steps: 1, content: 1000 },
    { steps: 3, content: 1000 },
    { steps: 1, content: 1600 },
    { steps: 1, content: 1000 },
  ],
  viewport,
);
const read = (index: number, y: number) => readPosition(track, index, y);

describe('site track geometry', () => {
  it('spaces steps at 30% of the viewport and transitions over one viewport', () => {
    expect(track.segments.map(({ start, range }) => [start, range])).toEqual([
      [0, 0],
      [1000, 600],
      [2600, 600],
      [4200, 0],
    ]);
    expect(track.height).toBe(5200);
  });

  it('keeps each stage pinned through its incoming transition, steps, and outgoing transition', () => {
    expect(track.segments.map(({ top, height }) => [top, height])).toEqual([
      [0, 2000],
      [0, 3600],
      [1600, 3600],
      [3200, 2000],
    ]);
  });

  it('enters from the viewport bottom edge and leaves through the top', () => {
    expect(read(1, 250)).toMatchObject({ offset: 750, step: 0, front: false });
    expect(read(1, 500)).toMatchObject({ offset: 500, front: true });
    expect(read(0, 500)).toMatchObject({ offset: -500, front: false });
    expect(read(0, 500).shared).toBe(0.5);
    expect(read(1, 500).shared).toBe(0.5);
    expect(read(0, 450)).toMatchObject({ offset: -450, shared: 1 });
    expect(read(1, 450).shared).toBe(0);
    expect(read(0, 550).shared).toBe(0);
    expect(read(1, 550)).toMatchObject({ offset: 450, shared: 1 });
    expect(read(1, 1700)).toMatchObject({ offset: -100, step: 2 });
    expect(read(1, 2700)).toMatchObject({ visible: false });
  });

  it('advances steps in short distances and reverses them on the way up', () => {
    const steps = (ys: number[]) => ys.map((y) => read(1, y).step);
    expect(steps([1000, 1140, 1160, 1300, 1440, 1460, 1600])).toEqual([
      0, 0, 1, 1, 1, 2, 2,
    ]);
    expect(steps([1600, 1460, 1440, 1160, 1140, 1000])).toEqual([
      2, 2, 1, 1, 0, 0,
    ]);
    for (const y of [1000, 1300, 1600]) expect(read(1, y).offset).toBe(0);
  });

  it('scrolls the inner content of a page that still overflows at the readable minimum', () => {
    expect(read(2, 2600)).toMatchObject({ offset: 0, inner: 0 });
    expect(read(2, 2900)).toMatchObject({ offset: 0, inner: 300 });
    expect(read(2, 3200)).toMatchObject({ offset: 0, inner: 600 });
    expect(read(2, 3400)).toMatchObject({ offset: -200, inner: 600 });
    expect(read(2, 2300)).toMatchObject({ offset: 300, inner: 0 });
  });

  it('pins the first page before the track and the last page after it', () => {
    expect(read(0, -300)).toMatchObject({ offset: 0, front: true });
    expect(read(3, 6000)).toMatchObject({ offset: 0, front: true });
  });

  it('always shows one front page and covers the viewport with visible content', () => {
    for (let y = 0; y <= track.height - viewport; y += 7) {
      const pages = track.segments.map((_, index) => read(index, y));
      expect(pages.filter((page) => page.front)).toHaveLength(1);
      const windows = pages
        .filter((page) => page.visible)
        .map((page) => [page.offset, page.offset + viewport])
        .sort(([a], [b]) => a - b);
      let covered = windows[0][0];
      expect(covered).toBeLessThanOrEqual(0);
      for (const [from, to] of windows) {
        expect(from).toBeLessThanOrEqual(covered);
        covered = Math.max(covered, to);
      }
      expect(covered).toBeGreaterThanOrEqual(viewport);
    }
  });

  it('places step positions where each step is complete', () => {
    expect(positionOf(track, 1, 0)).toBe(1000);
    expect(positionOf(track, 1, 1)).toBe(1300);
    expect(positionOf(track, 1, 2)).toBe(1600);
    expect(positionOf(track, 1, 9)).toBe(1600);
    expect(positionOf(track, 2, 0)).toBe(2600);
    for (const step of [0, 1, 2])
      expect(read(1, positionOf(track, 1, step)).step).toBe(step);
  });
});

describe('site snapping', () => {
  it('never snaps inside a step range or at a complete page', () => {
    for (const y of [0, 1000, 1200, 1600, 2600, 3000, 3200, 4200, 1600.5])
      expect(snapTarget(track, y)).toBeNull();
  });

  it('snaps a stopped transition to the nearer complete page', () => {
    expect(snapTarget(track, 300)).toBe(0);
    expect(snapTarget(track, 700)).toBe(1000);
    expect(snapTarget(track, 1700)).toBe(1600);
    expect(snapTarget(track, 2300)).toBe(2600);
    expect(snapTarget(track, 3500)).toBe(3200);
  });
});

const deck = defineDeck({
  id: 'site-routes',
  title: 'Site routes',
  size: { width: 1600, height: 900 },
  slides: [
    { id: 'intro', title: '開始之前', steps: 1 },
    { id: 'code', title: '程式碼', slug: 'code-walkthrough', steps: 3 },
    { id: 'end', title: 'The End', steps: 1 },
  ],
  chapters: [
    { id: 'learn', title: '開始學習', slug: 'basics', slideId: 'code' },
  ],
  previews: [],
  RenderSlide: () => null,
});

describe('site links', () => {
  it('uses #slug fragments with the presentation slugs and steps', () => {
    expect(getSiteHref(deck, 'code')).toBe('#code-walkthrough');
    expect(getSiteHref(deck, 'code', 1)).toBe('#code-walkthrough?step=2');
    expect(getSiteHref(deck, 'intro')).toBe(
      '#%E9%96%8B%E5%A7%8B%E4%B9%8B%E5%89%8D',
    );
    for (const id of ['intro', 'code', 'end'])
      expect(getSiteHref(deck, id, 2)).toBe(
        getSlideHref(deck, id, 2).replace('#/', '#'),
      );
    expect(() => getSiteHref(deck, 'missing')).toThrow();
  });

  it('parses site hashes, presentation hashes, aliases, and page numbers', () => {
    const routes = createSlideRoutes(deck);
    const code = { slideId: 'code', step: 0 };
    for (const hash of [
      '#code-walkthrough',
      '#/code-walkthrough',
      '#basics',
      '#開始學習',
      '#learn',
      '#2',
      '#/2',
    ])
      expect(parseSiteHash(routes, hash)).toEqual(code);
    expect(parseSiteHash(routes, '#code-walkthrough?step=2')).toEqual({
      slideId: 'code',
      step: 1,
    });
    expect(parseSiteHash(routes, '#/code-walkthrough?step=9')).toEqual({
      slideId: 'code',
      step: 2,
    });
    expect(parseSiteHash(routes, '#3')).toEqual({ slideId: 'end', step: 0 });
    for (const hash of ['', '#', '#/', '#4', '#0', '#missing'])
      expect(parseSiteHash(routes, hash)).toBeNull();
  });
});
