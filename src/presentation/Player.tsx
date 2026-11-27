import { useCallback, useEffect, useRef, useState } from 'react';
import { I18nProvider, useI18n } from '../i18n/context.js';
import type { Locale } from '../i18n/messages.js';
import { PlaybackProvider, usePlayback } from './context.js';
import { getNavigationAction } from './keyboard.js';
import { Modal } from './Modal.js';
import { PlayerHelp } from './PlayerHelp.js';
import { PlayerToolbar } from './PlayerToolbar.js';
import { usePresenter } from './Presenter.js';
import { SlideNavigator } from './SlideNavigator.js';
import { PresentationStage } from './Stage.js';
import type {
  DeckDefinition,
  NavigatorFilter,
  NavigatorView,
} from './types.js';

export function Player({
  deck,
  fresh = false,
  homeHref,
  locale,
}: {
  deck: DeckDefinition;
  fresh?: boolean;
  homeHref?: string;
  /** Interface language. Defaults to the nearest provider, then `zh-Hant`. */
  locale?: Locale;
}) {
  const Provider = deck.Provider;
  return (
    <I18nProvider locale={locale}>
      <PlaybackProvider key={deck.id} deck={deck} fresh={fresh}>
        {Provider ? (
          <Provider fresh={fresh}>
            <PlayerView homeHref={homeHref} />
          </Provider>
        ) : (
          <PlayerView homeHref={homeHref} />
        )}
      </PlaybackProvider>
    </I18nProvider>
  );
}

function PlayerView({ homeHref }: { homeHref?: string }) {
  const player = useRef<HTMLDivElement>(null);
  const runtime = usePlayback();
  const { t } = useI18n();
  const { deck, slide, actions } = runtime;
  const Navigator = deck.Navigator ?? SlideNavigator;
  const [menu, setMenu] = useState(false);
  const [menuFilter, setMenuFilter] = useState<NavigatorFilter>('all');
  const openNavigator = useCallback((filter?: NavigatorFilter) => {
    if (filter !== undefined) setMenuFilter(filter);
    setMenu(true);
  }, []);
  const [menuView, setMenuView] = useState<NavigatorView>(() => {
    try {
      return localStorage.getItem('immerslides:navigator:view') === 'thumbnails'
        ? 'thumbnails'
        : 'outline';
    } catch {
      return 'outline';
    }
  });
  const [help, setHelp] = useState(false);
  const [tools, setTools] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const presenter = usePresenter(setFeedback);
  const [ready, setReady] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const helpButton = useRef<HTMLButtonElement>(null);
  const pageInput = useRef<HTMLInputElement>(null);
  const revealTools = useCallback(() => {
    setTools(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setTools(false), 3000);
  }, []);
  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await player.current!.requestFullscreen();
    } catch {
      setFeedback(t('feedback.fullscreen'));
    }
  }, [t]);
  useEffect(() => {
    try {
      localStorage.setItem('immerslides:navigator:view', menuView);
    } catch {}
  }, [menuView]);
  useEffect(() => {
    setReady(true);
    document.title = `${slide.title} · ${deck.title} · immerslides`;
  }, [deck.title, slide.title]);
  useEffect(() => {
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', changed);
    revealTools();
    return () => {
      document.removeEventListener('fullscreenchange', changed);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [revealTools]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return;
      if (
        menu ||
        help ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.repeat ||
        event.defaultPrevented
      )
        return;
      const target = event.target as HTMLElement;
      if (
        target.closest(
          'input,textarea,select,[contenteditable]:not([contenteditable="false"])',
        ) ||
        (event.key === ' ' && target.closest('button,a'))
      )
        return;
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        pageInput.current!.focus();
        pageInput.current!.value = event.key;
        return;
      }
      const action = getNavigationAction(event.key, actions);
      if (action) {
        event.preventDefault();
        action();
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        void toggleFullscreen();
      }
      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        presenter.open();
      }
      if (event.key.toLowerCase() === 'o') {
        event.preventDefault();
        menuButton.current?.focus();
        openNavigator();
      }
      if (event.key === '?') {
        event.preventDefault();
        helpButton.current?.focus();
        setHelp(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, menu, help, presenter.open, openNavigator, toggleFullscreen]);
  const closeMenu = () => setMenu(false);
  const closeHelp = () => setHelp(false);

  return (
    <div className="immerslides-player" data-deck={deck.id}>
      <div
        ref={player}
        className="presentation-player projection-app"
        data-ready={ready}
        onPointerMove={revealTools}
        onPointerDown={revealTools}
      >
        <PresentationStage />
        <PlayerToolbar
          runtime={runtime}
          homeHref={homeHref}
          visible={tools || menu || help}
          fullscreen={fullscreen}
          menuButton={menuButton}
          helpButton={helpButton}
          pageInput={pageInput}
          onFocus={revealTools}
          onOpenNavigator={openNavigator}
          onOpenHelp={() => setHelp(true)}
          onToggleFullscreen={() => void toggleFullscreen()}
          onOpenPresenter={presenter.open}
        />
        {feedback && (
          <button
            type="button"
            className="player-feedback"
            aria-label={t('feedback.dismiss')}
            onClick={() => setFeedback('')}
          >
            <span role="status">{feedback}</span>
          </button>
        )}
        {menu && (
          <Modal
            title={t('navigator.title')}
            className="slide-navigator-modal"
            onClose={closeMenu}
          >
            <Navigator
              deck={deck}
              selectedId={slide.id}
              view={menuView}
              onViewChange={setMenuView}
              filter={menuFilter}
              onFilterChange={setMenuFilter}
              onSelect={(id) => {
                actions.jump(id);
                closeMenu();
              }}
            />
          </Modal>
        )}
        {help && (
          <Modal title={t('help.title')} onClose={closeHelp}>
            <PlayerHelp
              deck={deck}
              onRestart={() => {
                actions.restart();
                closeHelp();
              }}
            />
          </Modal>
        )}
      </div>
      {presenter.view}
    </div>
  );
}
