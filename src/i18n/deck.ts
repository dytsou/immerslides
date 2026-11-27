import type { DeckDefinition } from '../presentation/types.js';
import type { Locale } from './messages.js';

const sources = new WeakMap<object, DeckDefinition>();
const cache = new WeakMap<
  DeckDefinition,
  Partial<Record<Locale, DeckDefinition>>
>();

/** The deck as the author defined it, before any translation was applied. */
export function sourceDeck<T extends object>(deck: T): T {
  return (sources.get(deck) as T | undefined) ?? deck;
}

/**
 * Returns the deck with its authored text replaced by the translation for
 * `locale`. Without a translation, the source deck is returned unchanged.
 * Results are cached, and localizing a localized deck is a no-op.
 */
export function localizeDeck(
  deck: DeckDefinition,
  locale: Locale,
): DeckDefinition {
  const source = sourceDeck(deck);
  const translation = source.translations?.[locale];
  if (!translation) return source;
  const byLocale = cache.get(source) ?? {};
  cache.set(source, byLocale);
  const existing = byLocale[locale];
  if (existing) return existing;
  const localized: DeckDefinition = {
    ...source,
    title: translation.title ?? source.title,
    description: translation.description ?? source.description,
    slides: source.slides.map((slide) => {
      const entry = translation.slides?.[String(slide.id)];
      if (!entry) return slide;
      return {
        ...slide,
        title: entry.title ?? slide.title,
        notes: entry.notes ?? slide.notes,
      };
    }),
    chapters: source.chapters?.map((chapter) => {
      const title = translation.chapters?.[chapter.id];
      return title === undefined ? chapter : { ...chapter, title };
    }),
    handout: source.handout && {
      ...source.handout,
      title: translation.handout?.title ?? source.handout.title,
      href: translation.handout?.href ?? source.handout.href,
    },
  };
  sources.set(localized, source);
  byLocale[locale] = localized;
  return localized;
}
