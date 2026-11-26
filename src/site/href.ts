import {
  createSlideRoutes,
  parseSlideHash,
  type RouteDeck,
  type SlideRoutes,
  slideHref,
} from '../presentation/routing.js';
import type { SlideId } from '../presentation/types.js';

export function siteHref(routes: SlideRoutes, id: SlideId, step = 0) {
  return `#${slideHref(routes, id, step).slice(2)}`;
}

/** Reads `#slug` site hashes and presentation-style `#/slug` hashes. */
export function parseSiteHash(routes: SlideRoutes, hash: string) {
  return parseSlideHash(
    routes,
    hash.startsWith('#') && !hash.startsWith('#/')
      ? `#/${hash.slice(1)}`
      : hash,
  );
}

export function getSiteHref(deck: RouteDeck, id: SlideId, step = 0): string {
  return siteHref(createSlideRoutes(deck), id, step);
}
