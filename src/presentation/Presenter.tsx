import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePlayback } from './context.js';
import { getNavigationAction } from './keyboard.js';
import { SlidePreview } from './SlidePreview.js';
import { reduce } from './state.js';

type PresenterWindow = { window: Window; container: HTMLDivElement };
type TimerState = { startedAt: number | null; elapsed: number };

export function usePresenter(onFeedback: (message: string) => void) {
  const { deck } = usePlayback();
  const owned = useRef<PresenterWindow | null>(null);
  const [presenter, setPresenter] = useState<PresenterWindow | null>(null);
  const open = useCallback(() => {
    if (owned.current && !owned.current.window.closed) {
      owned.current.window.focus();
      return;
    }
    const popup = window.open('', '_blank', 'popup,width=1360,height=900');
    if (!popup) {
      onFeedback('無法開啟簡報者模式，請允許此網站的彈出式視窗後再試一次。');
      return;
    }
    const doc = popup.document;
    doc.title = `${deck.title} · 簡報者模式 · immerslides`;
    doc.documentElement.lang = document.documentElement.lang || 'zh-Hant';
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
  }, [deck.title, onFeedback]);

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
          <span className="presenter-eyebrow">immerslides · 簡報者模式</span>
          <h1>{deck.title}</h1>
        </div>
        <div className="presenter-clock">
          <div>
            <span className="presenter-eyebrow">
              {timer.startedAt === null ? '已暫停' : '已用時間'}
            </span>
            <output role="timer" aria-label="已用時間" aria-live="off">
              {time}
            </output>
          </div>
          <button
            type="button"
            className="presenter-button presenter-icon"
            aria-label={timer.startedAt === null ? '繼續計時' : '暫停計時'}
            title={timer.startedAt === null ? '繼續計時' : '暫停計時'}
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
            aria-label="重設計時"
            title="重設計時"
            onClick={resetTimer}
          >
            <RotateCcw size={18} />
          </button>
        </div>
        <button
          type="button"
          className="presenter-button presenter-icon"
          aria-label="關閉簡報者模式"
          title="關閉簡報者模式"
          onClick={() => popup.close()}
        >
          <X size={21} />
        </button>
      </header>
      <main className="presenter-grid">
        <section
          className="presenter-panel presenter-current"
          aria-label="目前投影片"
        >
          <div className="presenter-panel-heading">
            <h2>目前投影片</h2>
            <span>
              第 {index + 1} / {deck.slides.length} 頁 · 步驟 {state.step + 1} /{' '}
              {slide.steps}
            </span>
          </div>
          <SlidePreview deck={deck} slideId={slide.id} step={state.step} />
          <h3 className="presenter-slide-title">{slide.title}</h3>
        </section>
        <section
          className="presenter-panel presenter-next"
          aria-label="下一個畫面"
        >
          <div className="presenter-panel-heading">
            <h2>下一個畫面</h2>
            {!finished && (
              <span>
                第 {nextIndex + 1} 頁 · 步驟 {next.step + 1} / {nextSlide.steps}
              </span>
            )}
          </div>
          {finished ? (
            <div className="presenter-end">
              <strong>已到最後一頁</strong>
              <span>簡報結束，謝謝聆聽。</span>
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
          aria-label="簡報者備註"
        >
          <div className="presenter-panel-heading">
            <h2>簡報者備註</h2>
          </div>
          <p>{slide.notes || '此頁沒有備註。'}</p>
        </section>
      </main>
      <footer className="presenter-navigation">
        <span>觀眾畫面持續在原視窗放映</span>
        <div className="presenter-navigation-actions">
          <button
            type="button"
            className="presenter-button"
            onClick={actions.previous}
            disabled={index === 0 && state.step === 0}
          >
            <ArrowLeft size={19} />
            上一步
          </button>
          <output
            className="presenter-page-count"
            aria-label="目前頁碼"
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
            下一步
            <ArrowRight size={19} />
          </button>
        </div>
      </footer>
    </>
  );
}
