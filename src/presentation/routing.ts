import type { DeckDefinition, PlaybackState, SlideId } from './types.js';

type SlideTarget = Pick<PlaybackState, 'slideId' | 'step'>;
export type RouteDeck = Pick<DeckDefinition, 'slides' | 'chapters'>;
export type SlideRoutes = {
  slides: ReadonlyMap<SlideId, { slug: string; steps: number }>;
  targets: ReadonlyMap<string, SlideId>;
  pages: readonly SlideId[];
};

const normalizeSlug = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

export function createSlideRoutes(deck: RouteDeck): SlideRoutes {
  const slides = new Map<SlideId, { slug: string; steps: number }>();
  const targets = new Map<string, SlideId>();
  const bases = deck.slides.map((slide) => {
    const base =
      normalizeSlug(slide.title) || normalizeSlug(String(slide.id)) || 'slide';
    return /^\d+$/.test(base) ? `slide-${base}` : base;
  });
  const counts = new Map<string, number>();
  for (const base of bases) counts.set(base, (counts.get(base) ?? 0) + 1);
  const explicit = (value: string, id: SlideId) => {
    const slug = normalizeSlug(value);
    if (!slug) throw new Error('Slugs need at least one letter or number.');
    if (/^\d+$/.test(slug))
      throw new Error(
        'Numeric slugs are reserved for slide page numbers. Add a word to the slug.',
      );
    if (targets.has(slug) && targets.get(slug) !== id)
      throw new Error(`Duplicate slide or chapter slug: ${slug}`);
    targets.set(slug, id);
    return slug;
  };
  for (const slide of deck.slides)
    if (slide.slug !== undefined)
      slides.set(slide.id, {
        slug: explicit(slide.slug, slide.id),
        steps: slide.steps,
      });
  for (const chapter of deck.chapters ?? [])
    if (chapter.slug !== undefined) explicit(chapter.slug, chapter.slideId);

  const defaults = deck.slides
    .map((slide, index) => ({ slide, base: bases[index] }))
    .filter(({ slide }) => slide.slug === undefined)
    .sort((a, b) => (String(a.slide.id) < String(b.slide.id) ? -1 : 1));
  for (const { slide, base } of defaults) {
    let slug =
      counts.get(base)! > 1 ||
      (targets.has(base) && targets.get(base) !== slide.id)
        ? `${base}-${normalizeSlug(String(slide.id)) || 'slide'}`
        : base;
    const idSuffix = Array.from(String(slide.id), (char) =>
      char.codePointAt(0)!.toString(16),
    ).join('-');
    while (targets.has(slug) && targets.get(slug) !== slide.id)
      slug += `-${idSuffix}`;
    targets.set(slug, slide.id);
    slides.set(slide.id, { slug, steps: slide.steps });
  }

  const aliases = new Map<string, Set<SlideId>>();
  const alias = (value: string, id: SlideId) => {
    const slug = normalizeSlug(value);
    if (!slug || /^\d+$/.test(slug)) return;
    const owners = aliases.get(slug) ?? new Set<SlideId>();
    owners.add(id);
    aliases.set(slug, owners);
  };
  for (const slide of deck.slides) {
    alias(slide.title, slide.id);
    alias(String(slide.id), slide.id);
  }
  for (const chapter of deck.chapters ?? []) {
    alias(chapter.title, chapter.slideId);
    alias(chapter.id, chapter.slideId);
  }
  for (const [slug, owners] of aliases)
    if (!targets.has(slug) && owners.size === 1)
      targets.set(slug, owners.values().next().value!);
  return { slides, targets, pages: deck.slides.map((slide) => slide.id) };
}

export function parseSlideHash(
  routes: SlideRoutes,
  hash: string,
): SlideTarget | null {
  if (!hash.startsWith('#/')) return null;
  const separator = hash.indexOf('?');
  let token: string;
  try {
    token = decodeURIComponent(
      hash.slice(2, separator < 0 ? undefined : separator),
    )
      .normalize('NFKC')
      .trim();
  } catch {
    return null;
  }
  const numeric = /^\d+$/.test(token);
  const page = Number(token);
  const slideId = numeric
    ? Number.isSafeInteger(page) && page > 0
      ? routes.pages[page - 1]
      : undefined
    : routes.targets.get(normalizeSlug(token));
  if (slideId === undefined) return null;
  const values = new URLSearchParams(
    separator < 0 ? '' : hash.slice(separator + 1),
  ).getAll('step');
  const value =
    values.length === 1 && /^\d+$/.test(values[0]) ? Number(values[0]) : 1;
  const step = Number.isSafeInteger(value)
    ? Math.max(0, Math.min(routes.slides.get(slideId)!.steps - 1, value - 1))
    : 0;
  return { slideId, step };
}

export function slideHref(routes: SlideRoutes, id: SlideId, step = 0): string {
  const slide = routes.slides.get(id);
  if (!slide) throw new Error(`Unknown slide: ${id}`);
  if (!Number.isSafeInteger(step) || step < 0)
    throw new Error('Slide link steps must be nonnegative integers.');
  const bounded = Math.min(slide.steps - 1, step);
  return `#/${encodeURIComponent(slide.slug)}${bounded > 0 ? `?step=${bounded + 1}` : ''}`;
}

export function getSlideHref(deck: RouteDeck, id: SlideId, step = 0): string {
  return slideHref(createSlideRoutes(deck), id, step);
}
