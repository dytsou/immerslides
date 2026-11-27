import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/context.js';
import { usePlayback } from './context.js';
import { getNavigationAction } from './keyboard.js';
import { SlidePreview } from './SlidePreview.js';
import { reduce } from './state.js';

type PresenterWindow = { window: Window; container: HTMLDivElement };
type TimerState = { startedAt: number | null; elapsed: number };

export function usePresenter(onFeedback: (message: string) => void) {
  const { deck } = usePlayback();
  const { locale, t } = useI18n();
  const owned = useRef<PresenterWindow | null>(null);
  const [presenter, setPresenter] = useState<PresenterWindow | null>(null);
  const open = useCallback(() => {
    if (owned.current && !owned.current.window.closed) {
      owned.current.window.focus();
      return;
    }
    const popup = window.open('', '_blank', 'popup,width=1360,height=900');
    if (!popup) {
      onFeedback(t('presenter.popupBlocked'));
      return;
    }
    const doc = popup.document;
    doc.title = t('presenter.title', { deck: deck.title });
    doc.documentElement.lang = locale;
    const base = doc.createElement('base');
    base.href = document.baseURI;
    doc.head.append(base);
    for (const source of document.querySelectorAll(
      'style, link[rel="stylesheet"]',
    )) {
      const style = source.cloneNode(true) as
        | HTMLStyleElement
        | HTMLLinkElement;
      if (source instanceof HTMLLinkElement && style instanceof HTMLLinkElement)
        style.href = source.href;
      doc.head.append(style);
    }
    doc.body.style.margin = '0';
    const container = doc.createElement('div');
    container.className = 'immerslides-presenter';
    doc.body.append(container);
    const next = { window: popup, container };
    owned.current = next;
    setPresenter(next);
    onFeedback('');
    popup.focus();
  }, [deck.title, locale, onFeedback, t]);

  useEffect(
    () => () => {
      owned.current?.window.close();
      owned.current = null;
      setPresenter(null);
    },
    [deck],
  );

  useEffect(() => {
    if (!presenter) return;
    const closed = () => {
      if (owned.current === presenter) owned.current = null;
      setPresenter((current) => (current === presenter ? null : current));
    };
    const close = () => presenter.window.close();
    const check = window.setInterval(() => {
      if (presenter.window.closed) closed();
    }, 500);
    presenter.window.addEventListener('pagehide', closed);
    window.addEventListener('pagehide', close);
    return () => {
      window.clearInterval(check);
      presenter.window.removeEventListener('pagehide', closed);
      window.removeEventListener('pagehide', close);
      presenter.window.close();
    };
  }, [presenter]);

  return {
    open,
    view:
      presenter &&
      createPortal(
        <PresenterConsole popup={presenter.window} />,
        presenter.container,
      ),
  };
}

function PresenterConsole({ popup }: { popup: Window }) {
  const { deck, slide, state, index, actions } = usePlayback();
  const { t } = useI18n();
  const [timer, setTimer] = useState<TimerState>(() => ({
    startedAt: Date.now(),
    elapsed: 0,
  }));
  const [now, setNow] = useState(Date.now);
  const next = reduce(deck, state, { type: 'next' });
  const finished = next === state;
  const nextIndex = deck.slides.findIndex((item) => item.id === next.slideId);
  const nextSlide = deck.slides[nextIndex];
  const elapsed =
    timer.elapsed +
    (timer.startedAt === null ? 0 : Math.max(0, now - timer.startedAt));
  const seconds = Math.floor(elapsed / 1000);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (timer.startedAt === null) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [timer.startedAt]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.repeat ||
        event.defaultPrevented
      )
        return;
      const target = event.target as Element | null;
      if (
        target?.closest?.(
          'input,textarea,select,[contenteditable]:not([contenteditable="false"])',
        ) ||
        (event.key === ' ' && target?.closest?.('button,a'))
      )
        return;
      const action = getNavigationAction(event.key, actions);
      if (action) {
        event.preventDefault();
        action();
      }
    };
    popup.addEventListener('keydown', onKey);
    return () => popup.removeEventListener('keydown', onKey);
  }, [popup, actions]);

  const toggleTimer = () => {
    const timestamp = Date.now();
    setNow(timestamp);
    setTimer((current) =>
      current.startedAt === null
        ? { ...current, startedAt: timestamp }
        : {
            startedAt: null,
            elapsed:
              current.elapsed + Math.max(0, timestamp - current.startedAt),
          },
    );
  };
  const resetTimer = () => {
    const timestamp = Date.now();
    setNow(timestamp);
    setTimer((current) => ({
      elapsed: 0,
      startedAt: current.startedAt === null ? null : timestamp,
    }));
  };

  return (
    <>
      <header className="presenter-header">
        <div className="presenter-heading">
          <span className="presenter-eyebrow">{t('presenter.eyebrow')}</span>
          <h1>{deck.title}</h1>
        </div>
        <div className="presenter-clock">
          <div>
            <span className="presenter-eyebrow">
              {timer.startedAt === null
                ? t('presenter.paused')
                : t('presenter.elapsed')}
            </span>
            <output
              role="timer"
              aria-label={t('presenter.elapsed')}
              aria-live="off"
            >
              {time}
            </output>
          </div>
          <button
            type="button"
            className="presenter-button presenter-icon"
            aria-label={
              timer.startedAt === null
                ? t('presenter.resumeTimer')
                : t('presenter.pauseTimer')
            }
            title={
              timer.startedAt === null
                ? t('presenter.resumeTimer')
                : t('presenter.pauseTimer')
            }
            onClick={toggleTimer}
          >
            {timer.startedAt === null ? (
              <Play size={18} />
            ) : (
              <Pause size={18} />
            )}
          </button>
          <button
            type="button"
            className="presenter-button presenter-icon"
            aria-label={t('presenter.resetTimer')}
            title={t('presenter.resetTimer')}
            onClick={resetTimer}
          >
            <RotateCcw size={18} />
          </button>
        </div>
        <button
          type="button"
          className="presenter-button presenter-icon"
          aria-label={t('presenter.close')}
          title={t('presenter.close')}
          onClick={() => popup.close()}
        >
          <X size={21} />
        </button>
      </header>
      <main className="presenter-grid">
        <section
          className="presenter-panel presenter-current"
          aria-label={t('presenter.current')}
        >
          <div className="presenter-panel-heading">
            <h2>{t('presenter.current')}</h2>
            <span>
              {t('presenter.currentPosition', {
                page: index + 1,
                total: deck.slides.length,
                step: state.step + 1,
                steps: slide.steps,
              })}
            </span>
          </div>
          <SlidePreview deck={deck} slideId={slide.id} step={state.step} />
          <h3 className="presenter-slide-title">{slide.title}</h3>
        </section>
        <section
          className="presenter-panel presenter-next"
          aria-label={t('presenter.upNext')}
        >
          <div className="presenter-panel-heading">
            <h2>{t('presenter.upNext')}</h2>
            {!finished && (
              <span>
                {t('presenter.nextPosition', {
                  page: nextIndex + 1,
                  step: next.step + 1,
                  steps: nextSlide.steps,
                })}
              </span>
            )}
          </div>
          {finished ? (
            <div className="presenter-end">
              <strong>{t('presenter.ended')}</strong>
              <span>{t('presenter.endedCopy')}</span>
            </div>
          ) : (
            <>
              <SlidePreview
                deck={deck}
                slideId={next.slideId}
                step={next.step}
              />
              <h3 className="presenter-slide-title">{nextSlide.title}</h3>
            </>
          )}
        </section>
        <section
          className="presenter-panel presenter-notes"
          aria-label={t('presenter.notes')}
        >
          <div className="presenter-panel-heading">
            <h2>{t('presenter.notes')}</h2>
          </div>
          <p>{slide.notes || t('presenter.noNotes')}</p>
        </section>
      </main>
      <footer className="presenter-navigation">
        <span>{t('presenter.audienceNote')}</span>
        <div className="presenter-navigation-actions">
          <button
            type="button"
            className="presenter-button"
            onClick={actions.previous}
            disabled={index === 0 && state.step === 0}
          >
            <ArrowLeft size={19} />
            {t('presenter.previousStep')}
          </button>
          <output
            className="presenter-page-count"
            aria-label={t('presenter.pageNumber')}
            aria-live="off"
          >
            {index + 1} / {deck.slides.length}
          </output>
          <button
            type="button"
            className="presenter-button presenter-primary"
            onClick={actions.next}
            disabled={finished}
          >
            {t('presenter.nextStep')}
            <ArrowRight size={19} />
          </button>
        </div>
      </footer>
    </>
  );
}
