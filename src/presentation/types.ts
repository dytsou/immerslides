import type { ComponentType, ReactNode } from 'react';
import { createSlideRoutes } from './routing.js';

export type SlideId = string | number;
export type SlideDefinition = {
  id: SlideId;
  title: string;
  steps: number;
  slug?: string;
  notes?: string;
};
export type NavigationAction =
  | { type: 'next' | 'previous' | 'nextSlide' | 'previousSlide' | 'restart' }
  | { type: 'jump'; id: SlideId }
  | { type: 'navigate'; target: Pick<PlaybackState, 'slideId' | 'step'> };
export type PlaybackState = {
  schema: 1;
  deckVersion: number;
  slideId: SlideId;
  step: number;
  generation: number;
};
export type PresentationActions = {
  next: () => void;
  previous: () => void;
  nextSlide: () => void;
  previousSlide: () => void;
  jump: (id: SlideId) => void;
  restart: () => void;
};
export type SlideRenderProps = {
  slide: SlideDefinition;
  step: number;
  mode: 'playback' | 'preview';
  still: boolean;
  active: boolean;
  reducedMotion: boolean;
  actions: PresentationActions;
};
/** Animate toward the renderer's authored final layout. Returned animations
 * are canceled after completion or interruption. */
export type TransitionDefinition = {
  name: string;
  /** Optional read-only snapshot of the live incoming layer before React changes
   * its DOM or cancels its animations. Return geometry/styles, not live nodes. */
  capture?: (current: HTMLElement) => unknown;
  /** Opt in to the same before-mutation capture on an in-place step update.
   * The current layer is already at its new authored layout when this runs. */
  animateStep?: (update: {
    current: HTMLElement;
    snapshot: unknown;
  }) => Animation | Animation[];
  animate: (
    layers: {
      incoming: HTMLElement;
      outgoing: HTMLElement;
      snapshot?: unknown;
    },
    direction: -1 | 1,
  ) => Animation | Animation[];
};
export type PlaybackRuntime = {
  deck: DeckDefinition;
  state: PlaybackState;
  slide: SlideDefinition;
  index: number;
  actions: PresentationActions;
};
export type NavigatorView = 'outline' | 'thumbnails';
export type NavigatorFilter = 'all' | 'marked';
export type SlideNavigatorProps = {
  deck: DeckDefinition;
  selectedId: SlideId;
  onSelect: (id: SlideId) => void;
  view: NavigatorView;
  onViewChange: (view: NavigatorView) => void;
  filter: NavigatorFilter;
  onFilterChange: (filter: NavigatorFilter) => void;
  markedSlides?: ReadonlySet<SlideId>;
  onToggleMark?: (id: SlideId) => void;
};
export type PlayerControlsProps = PlaybackRuntime & {
  openNavigator: (filter?: NavigatorFilter) => void;
};
export type StageOverlayProps = PlaybackRuntime & {
  viewport: { width: number; height: number };
  scale: number;
};
export type DeckDefinition = {
  id: string;
  title: string;
  version?: number;
  description?: string;
  size: { width: number; height: number };
  slides: readonly SlideDefinition[];
  previews: readonly { slideId: SlideId; step?: number }[];
  RenderSlide: ComponentType<SlideRenderProps>;
  chapters?: readonly {
    id: string;
    title: string;
    slideId: SlideId;
    slug?: string;
  }[];
  handout?: { title: string; href: string };
  transition?: TransitionDefinition | false;
  /** Set for decks whose page poses should land immediately and animate only on manual steps. */
  freezeEntranceOnNavigation?: boolean;
  reserveWidth?: (
    slide: SlideDefinition,
    viewport: { width: number; height: number },
  ) => number;
  Overlay?: ComponentType<StageOverlayProps>;
  Provider?: ComponentType<{ children: ReactNode; fresh: boolean }>;
  Controls?: ComponentType<PlayerControlsProps>;
  Navigator?: ComponentType<SlideNavigatorProps>;
  Help?: ComponentType;
};

export function defineDeck<T extends DeckDefinition>(deck: T): T {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(deck.id))
    throw new Error('Deck IDs must be URL-safe slugs.');
  if (
    !deck.slides.length ||
    new Set(deck.slides.map((slide) => String(slide.id))).size !==
      deck.slides.length
  )
    throw new Error(`Deck ${deck.id} needs slides with unique IDs.`);
  if (
    !Number.isFinite(deck.size.width) ||
    !Number.isFinite(deck.size.height) ||
    deck.size.width <= 0 ||
    deck.size.height <= 0
  )
    throw new Error(`Deck ${deck.id} needs a positive stage size.`);
  for (const slide of deck.slides)
    if (!Number.isInteger(slide.steps) || slide.steps < 1)
      throw new Error(`Slide ${slide.id} needs at least one step.`);
  for (const slide of deck.slides)
    if (
      typeof slide.id === 'number'
        ? !Number.isFinite(slide.id)
        : typeof slide.id !== 'string' || !slide.id.trim()
    )
      throw new Error('Slide IDs must be nonempty strings or finite numbers.');
  if (
    deck.version !== undefined &&
    (!Number.isSafeInteger(deck.version) || deck.version < 1)
  )
    throw new Error('Deck versions must be positive integers.');
  for (const preview of deck.previews) {
    const slide = deck.slides.find((slide) => slide.id === preview.slideId);
    if (
      !slide ||
      (preview.step !== undefined &&
        (!Number.isInteger(preview.step) ||
          preview.step < 0 ||
          preview.step >= slide.steps))
    )
      throw new Error(`Invalid preview in deck ${deck.id}.`);
  }
  let previousChapter = -1;
  const chapterIds = new Set<string>();
  for (const chapter of deck.chapters ?? []) {
    const index = deck.slides.findIndex(
      (slide) => slide.id === chapter.slideId,
    );
    if (!chapter.id || chapterIds.has(chapter.id) || index <= previousChapter)
      throw new Error(
        'Chapters need unique IDs and existing start slides in presentation order.',
      );
    chapterIds.add(chapter.id);
    previousChapter = index;
  }
  createSlideRoutes(deck);
  return deck;
}
