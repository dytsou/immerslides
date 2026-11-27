import type { Locale } from 'immerslides';

/** `/` shows this view. `/slides/` and `/site/` always show their own view. */
export const defaultView: 'slides' | 'site' = 'slides';

/** Interface language for the player and site: `zh-Hant` or `en`. Slide text lives in `deck.tsx`. */
export const locale: Locale = 'zh-Hant';
