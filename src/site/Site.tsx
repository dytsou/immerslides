import {
  memo,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createSlideRoutes, slideHref } from '../presentation/routing.js';
import type {
  DeckDefinition,
  PresentationActions,
} from '../presentation/types.js';
import { useReducedMotion } from '../presentation/useReducedMotion.js';
import { SiteContext } from './context.js';
import { parseSiteHash, siteHref } from './href.js';
import {
  createTrack,
  positionOf,
  readPosition,
  snapTarget,
  type TrackSegment,
} from './track.js';

export type SiteProps = {
  deck: DeckDefinition;
  /** Presentation entry that receives the current `#/slug?step=` fragment. */
  presentationHref?: string;
};

type Viewport = { width: number; height: number };
type Layout = { scale: number; content: number };
type View = { step: number; active: boolean; front: boolean };
type Anchor = { index: number; local: number; reduced: boolean };

const MIN_SCALE = 0.5;
const MAX_SCALE = 1.5;
const SNAP_DURATION = 320;

const sameView = (a: View, b: View) =>
  a.step === b.step && a.active === b.active && a.front === b.front;

const withHash = (hash: string) => {
  const url = new URL(window.location.href);
  url.hash = hash;
  return url;
};

export function Site(props: SiteProps) {
  return <SiteView key={props.deck.id} {...props} />;
}

function SiteView({ deck, presentationHref }: SiteProps) {
  const reduced = useReducedMotion();
  const routes = useMemo(() => createSlideRoutes(deck), [deck]);
  const probe = useRef<HTMLDivElement>(null);
  const trackElement = useRef<HTMLDivElement>(null);
  const sections = useRef<(HTMLElement | null)[]>([]);
  const written = useRef<string[]>([]);
  const anchor = useRef<Anchor | null>(null);
  const started = useRef(false);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [layouts, setLayouts] = useState<readonly (Layout | null)[]>(() =>
    deck.slides.map(() => null),
  );
  const [views, setViews] = useState<readonly View[]>(() =>
    deck.slides.map(() => ({ step: 0, active: false, front: false })),
  );
  const [ready, setReady] = useState(false);
  const measured = layouts.every((layout) => layout !== null);
  const track = useMemo(
    () =>
      viewport && measured
        ? createTrack(
            layouts.map((layout, index) => ({
              steps: deck.slides[index].steps,
              content: layout!.content,
            })),
            viewport.height,
          )
        : null,
    [deck, layouts, measured, viewport],
  );
  const latest = useRef({ track, reduced, views, layouts, viewport });
  useLayoutEffect(() => {
    latest.current = { track, reduced, views, layouts, viewport };
  });

  useLayoutEffect(() => {
    const measure = () => {
      const width = trackElement.current!.clientWidth;
      const height = Math.round(probe.current!.getBoundingClientRect().height);
      setViewport((current) =>
        current?.width === width && current.height === height
          ? current
          : { width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(probe.current!);
    observer.observe(trackElement.current!);
    return () => observer.disconnect();
  }, []);

  const onLayout = useCallback(
    (index: number, layout: Layout) =>
      setLayouts((current) => {
        const previous = current[index];
        if (
          previous &&
          Math.abs(previous.scale - layout.scale) < 1e-4 &&
          Math.abs(previous.content - layout.content) < 0.5
        )
          return current;
        const next = current.slice();
        next[index] = layout;
        return next;
      }),
    [],
  );

  const pageTop = useCallback((index: number, step: number) => {
    const { track, reduced } = latest.current;
    if (reduced || !track)
      return (
        sections.current[index]!.getBoundingClientRect().top + window.scrollY
      );
    return (
      trackElement.current!.getBoundingClientRect().top +
      window.scrollY +
      positionOf(track, index, step)
    );
  }, []);

  const scrollToPage = useCallback(
    (index: number, step: number, behavior: ScrollBehavior) =>
      window.scrollTo({ top: pageTop(index, step), behavior }),
    [pageTop],
  );

  const scrollToHash = useCallback(() => {
    const target = parseSiteHash(routes, window.location.hash);
    const index = target
      ? deck.slides.findIndex((slide) => slide.id === target.slideId)
      : 0;
    scrollToPage(index, target?.step ?? 0, 'instant');
  }, [deck, routes, scrollToPage]);

  const update = useCallback(() => {
    const { track, reduced, viewport, layouts } = latest.current;
    if (!viewport || (!reduced && !track)) return;
    const y = -trackElement.current!.getBoundingClientRect().top;
    const next = deck.slides.map((slide, index): View => {
      const section = sections.current[index]!;
      let view: View;
      let local: number;
      if (reduced || !track) {
        const rect = section.getBoundingClientRect();
        const middle = viewport.height / 2;
        view = {
          step: slide.steps - 1,
          active: rect.bottom > 0 && rect.top < viewport.height,
          front: rect.top <= middle && rect.bottom > middle,
        };
        local = -rect.top;
      } else {
        const position = readPosition(track, index, y);
        view = {
          step: position.step,
          active: position.visible,
          front: position.front,
        };
        local = y - track.segments[index].start;
        if (position.visible) {
          const scale = layouts[index]!.scale;
          const shift = `${(position.offset - position.inner) / scale}px`;
          const inner = `${position.inner / scale}px`;
          const shared = String(position.shared);
          const key = `${shift} ${inner} ${shared}`;
          if (written.current[index] !== key) {
            written.current[index] = key;
            section.style.setProperty('--immersite-shift', shift);
            section.style.setProperty('--immersite-inner', inner);
            section.style.setProperty('--immersite-shared', shared);
          }
        }
      }
      section.toggleAttribute('data-visible', view.active);
      section.toggleAttribute('data-front', view.front);
      if (view.front)
        anchor.current = { index, local, reduced: reduced || !track };
      return view;
    });
    setViews((current) =>
      next.every((view, index) => sameView(view, current[index]))
        ? current
        : next.map((view, index) =>
            sameView(view, current[index]) ? current[index] : view,
          ),
    );
  }, [deck]);

  const geometry = reduced ? (measured ? layouts : null) : track;
  useLayoutEffect(() => {
    if (!geometry) return;
    if (!started.current) {
      started.current = true;
      scrollToHash();
      setReady(true);
    } else if (anchor.current) {
      const { index, local, reduced: anchored } = anchor.current;
      const current = reduced || !track;
      window.scrollTo({
        top: pageTop(index, 0) + (anchored === current ? local : 0),
        behavior: 'instant',
      });
    }
    update();
  }, [geometry, reduced, track, pageTop, scrollToHash, update]);

  useEffect(() => {
    let request = 0;
    const schedule = () => {
      if (!request)
        request = requestAnimationFrame(() => {
          request = 0;
          update();
        });
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(request);
    };
  }, [update]);

  useEffect(() => {
    const restoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = restoration;
    };
  }, []);

  useEffect(() => {
    window.addEventListener('hashchange', scrollToHash);
    window.addEventListener('popstate', scrollToHash);
    return () => {
      window.removeEventListener('hashchange', scrollToHash);
      window.removeEventListener('popstate', scrollToHash);
    };
  }, [scrollToHash]);

  useEffect(() => {
    if (!ready || reduced || !track) return;
    const scrollEnd = window.onscrollend !== undefined;
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let touching = false;
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const snap = () => {
      if (frame || touching) return;
      const from = window.scrollY;
      const y = -trackElement.current!.getBoundingClientRect().top;
      const target = snapTarget(track, y);
      if (target === null) return;
      const start = performance.now();
      const glide = (now: number) => {
        const progress = Math.min(1, (now - start) / SNAP_DURATION);
        window.scrollTo({
          top: from + (target - y) * (1 - (1 - progress) ** 3),
          behavior: 'instant',
        });
        frame = progress < 1 ? requestAnimationFrame(glide) : 0;
      };
      frame = requestAnimationFrame(glide);
    };
    const settle = () => {
      clearTimeout(timer);
      timer = setTimeout(snap, 150);
    };
    const press = () => {
      touching = true;
      stop();
    };
    const release = () => {
      touching = false;
      if (!scrollEnd) settle();
    };
    const listeners: [string, () => void][] = [
      scrollEnd ? ['scrollend', snap] : ['scroll', settle],
      ['wheel', stop],
      ['keydown', stop],
      ['pointerdown', stop],
      ['touchstart', press],
      ['touchend', release],
      ['touchcancel', release],
    ];
    for (const [type, listener] of listeners)
      window.addEventListener(type, listener, { passive: true });
    return () => {
      stop();
      clearTimeout(timer);
      for (const [type, listener] of listeners)
        window.removeEventListener(type, listener);
    };
  }, [ready, reduced, track]);

  const frontIndex = views.findIndex((view) => view.front);
  useEffect(() => {
    if (!ready || frontIndex < 0) return;
    const slide = deck.slides[frontIndex];
    const href = siteHref(routes, slide.id);
    if (window.location.hash !== href)
      window.history.replaceState(window.history.state, '', withHash(href));
    document.title = `${slide.title} · ${deck.title}`;
  }, [deck, routes, ready, frontIndex]);

  const actions = useMemo(
    () =>
      deck.slides.map((slide, index): PresentationActions => {
        const go = (target: number, step: number) => {
          if (target < 0 || target >= deck.slides.length) return;
          scrollToPage(
            target,
            step,
            latest.current.reduced ? 'instant' : 'smooth',
          );
        };
        const step = () =>
          latest.current.reduced
            ? slide.steps - 1
            : latest.current.views[index].step;
        return {
          next: () =>
            step() < slide.steps - 1 ? go(index, step() + 1) : go(index + 1, 0),
          previous: () =>
            step() > 0
              ? go(index, step() - 1)
              : go(index - 1, (deck.slides[index - 1]?.steps ?? 1) - 1),
          nextSlide: () => go(index + 1, 0),
          previousSlide: () => go(index - 1, 0),
          jump: (id) => {
            const target = deck.slides.findIndex((item) => item.id === id);
            if (target < 0) return;
            const href = siteHref(routes, id);
            if (window.location.hash !== href)
              window.history.pushState(
                window.history.state,
                '',
                withHash(href),
              );
            go(target, 0);
          },
          restart: () => go(0, 0),
        };
      }),
    [deck, routes, scrollToPage],
  );

  const front = deck.slides[Math.max(0, frontIndex)];
  const frontStep = reduced || frontIndex < 0 ? 0 : views[frontIndex].step;
  const motion = reduced ? 'reduced' : 'animated';
  return (
    <SiteContext.Provider value={motion}>
      <div
        className="immersite"
        data-deck={deck.id}
        data-motion={motion}
        data-ready={ready || undefined}
      >
        <div className="immersite-probe" ref={probe} aria-hidden />
        <div
          className="immersite-track"
          ref={trackElement}
          style={!reduced && track ? { height: track.height } : undefined}
        >
          {viewport &&
            deck.slides.map((slide, index) => (
              <SitePage
                key={String(slide.id)}
                deck={deck}
                index={index}
                slug={routes.slides.get(slide.id)!.slug}
                viewport={viewport}
                reduced={reduced}
                segment={reduced ? null : (track?.segments[index] ?? null)}
                view={views[index]}
                actions={actions[index]}
                onLayout={onLayout}
                sections={sections}
              />
            ))}
        </div>
        {presentationHref !== undefined && (
          <a
            className="immersite-presentation"
            href={presentationHref + slideHref(routes, front.id, frontStep)}
          >
            放映簡報
          </a>
        )}
      </div>
    </SiteContext.Provider>
  );
}

const SitePage = memo(function SitePage({
  deck,
  index,
  slug,
  viewport,
  reduced,
  segment,
  view,
  actions,
  onLayout,
  sections,
}: {
  deck: DeckDefinition;
  index: number;
  slug: string;
  viewport: Viewport;
  reduced: boolean;
  segment: TrackSegment | null;
  view: View;
  actions: PresentationActions;
  onLayout: (index: number, layout: Layout) => void;
  sections: RefObject<(HTMLElement | null)[]>;
}) {
  const slide = deck.slides[index];
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = canvas.current!;
    const { width, height } = viewport;
    const apply = (scale: number) => {
      element.style.width = `${width / scale}px`;
      element.style.setProperty('--immersite-height', `${height / scale}px`);
      element.style.transform = `scale(${scale})`;
      return element.offsetHeight;
    };
    const measure = () => {
      let scale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, width / deck.size.width, height / deck.size.height),
      );
      let design = apply(scale);
      for (
        let round = 0;
        !reduced &&
        round < 4 &&
        scale > MIN_SCALE &&
        design > height / scale + 1;
        round++
      ) {
        scale = Math.max(MIN_SCALE, height / design);
        design = apply(scale);
      }
      const content =
        reduced || design > height / scale + 1 ? design * scale : height;
      stage.current!.style.height = reduced ? `${content}px` : '';
      onLayout(index, { scale, content });
    };
    measure();
    let request = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(request);
      request = requestAnimationFrame(measure);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(request);
    };
  }, [deck.size, index, viewport, reduced, onLayout]);
  return (
    <section
      ref={(element) => {
        sections.current[index] = element;
      }}
      className="immersite-page"
      data-page={slide.id}
      aria-label={slide.title}
      style={segment ? { top: segment.top, height: segment.height } : undefined}
    >
      <span
        className="immersite-anchor"
        id={slug}
        style={segment ? { top: segment.start - segment.top } : undefined}
      />
      <div className="immersite-stage" ref={stage}>
        <div className="immersite-canvas" ref={canvas}>
          <deck.RenderSlide
            slide={slide}
            step={reduced ? slide.steps - 1 : view.step}
            mode="playback"
            active={view.active}
            still={!view.active || reduced}
            reducedMotion={reduced}
            actions={actions}
          />
        </div>
      </div>
    </section>
  );
});
