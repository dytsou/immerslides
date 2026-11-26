import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { createSlideRoutes, parseSlideHash, slideHref } from './routing.js';
import { progressKey, readProgress, reduce } from './state.js';
import type {
  DeckDefinition,
  NavigationAction,
  PlaybackRuntime,
} from './types.js';

const Context = createContext<PlaybackRuntime | null>(null);

export function PlaybackProvider({
  deck,
  fresh,
  children,
}: {
  deck: DeckDefinition;
  fresh: boolean;
  children: ReactNode;
}) {
  const routes = useMemo(() => createSlideRoutes(deck), [deck]);
  const navigation = useRef<{
    initialized: boolean;
    target: Pick<PlaybackRuntime['state'], 'slideId' | 'step'> | null;
  }>({ initialized: false, target: null });
  const [state, dispatch] = useReducer(
    (state: PlaybackRuntime['state'], action: NavigationAction) =>
      reduce(deck, state, action),
    null,
    () => readProgress(deck, fresh),
  );
  useEffect(() => {
    try {
      sessionStorage.setItem(progressKey(deck.id), JSON.stringify(state));
    } catch {}
  }, [deck.id, state, fresh]);
  useEffect(() => {
    const navigate = () => {
      const target = parseSlideHash(routes, window.location.hash) ?? {
        slideId: deck.slides[0].id,
        step: 0,
      };
      navigation.current.target = target;
      dispatch({ type: 'navigate', target });
    };
    window.addEventListener('popstate', navigate);
    window.addEventListener('hashchange', navigate);
    return () => {
      window.removeEventListener('popstate', navigate);
      window.removeEventListener('hashchange', navigate);
    };
  }, [deck, routes]);
  useEffect(() => {
    const href = slideHref(routes, state.slideId, state.step);
    const { initialized, target } = navigation.current;
    const fromUrl =
      target?.slideId === state.slideId && target.step === state.step;
    if (window.location.hash !== href) {
      const url = new URL(window.location.href);
      url.hash = href;
      window.history[!initialized || fromUrl ? 'replaceState' : 'pushState'](
        window.history.state,
        '',
        url,
      );
    }
    navigation.current = { initialized: true, target: null };
  }, [routes, state]);
  const actions = useMemo(
    () => ({
      next: () => dispatch({ type: 'next' }),
      previous: () => dispatch({ type: 'previous' }),
      nextSlide: () => dispatch({ type: 'nextSlide' }),
      previousSlide: () => dispatch({ type: 'previousSlide' }),
      jump: (id: string | number) => dispatch({ type: 'jump', id }),
      restart: () => dispatch({ type: 'restart' }),
    }),
    [],
  );
  const index = deck.slides.findIndex((slide) => slide.id === state.slideId);
  const runtime = useMemo(
    () => ({ deck, state, slide: deck.slides[index], index, actions }),
    [deck, state, index, actions],
  );
  return <Context.Provider value={runtime}>{children}</Context.Provider>;
}

export function usePlayback(): PlaybackRuntime {
  const runtime = useContext(Context);
  if (!runtime)
    throw new Error('usePlayback must be called inside PlaybackProvider.');
  return runtime;
}
