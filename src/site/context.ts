import { createContext } from 'react';

export type SiteMotion = 'animated' | 'reduced';

/** Set inside a Site. Previews and the Player leave it null. */
export const SiteContext = createContext<SiteMotion | null>(null);
