import {
  ArrowLeft,
  ArrowRight,
  ChevronFirst,
  ChevronLast,
  Grid2X2,
  HelpCircle,
  Home,
  Maximize,
  Minimize,
  Monitor,
} from 'lucide-react';
import type { RefObject } from 'react';
import { IconButton } from './IconButton.js';
import { PageNumberInput } from './PageNumberInput.js';
import type { NavigatorFilter, PlaybackRuntime } from './types.js';

type PlayerToolbarProps = {
  runtime: PlaybackRuntime;
  homeHref?: string;
  visible: boolean;
  fullscreen: boolean;
  menuButton: RefObject<HTMLButtonElement | null>;
  helpButton: RefObject<HTMLButtonElement | null>;
  pageInput: RefObject<HTMLInputElement | null>;
  onFocus: () => void;
  onOpenNavigator: (filter?: NavigatorFilter) => void;
  onOpenHelp: () => void;
  onToggleFullscreen: () => void;
  onOpenPresenter: () => void;
};

export function PlayerToolbar({
  runtime,
  homeHref,
  visible,
  fullscreen,
  menuButton,
  helpButton,
  pageInput,
  onFocus,
  onOpenNavigator,
  onOpenHelp,
  onToggleFullscreen,
  onOpenPresenter,
}: PlayerToolbarProps) {
  const { deck, state, slide, index, actions } = runtime;
  return (
    <div
      className={`presentation-controls projection-controls ${visible ? 'visible' : ''}`}
      onFocus={onFocus}
    >
      {homeHref && (
        <a
          href={homeHref}
          className="icon-button"
          aria-label="返回首頁"
          title="返回首頁"
        >
          <Home size={20} />
        </a>
      )}
      <button
        type="button"
        className="icon-button"
        aria-label="章節與頁面（O）"
        title="章節與頁面（O）"
        ref={menuButton}
        onClick={() => onOpenNavigator()}
      >
        <Grid2X2 size={20} />
      </button>
      <div className="control-divider" />
      <IconButton
        label="上一頁（Page Up）"
        secondary
        onClick={actions.previousSlide}
        disabled={index === 0}
      >
        <ChevronFirst size={20} />
      </IconButton>
      <IconButton
        label="上一步（←）"
        onClick={actions.previous}
        disabled={index === 0 && state.step === 0}
      >
        <ArrowLeft size={22} />
      </IconButton>
      <PageNumberInput
        deck={deck}
        index={index}
        onJump={actions.jump}
        inputRef={pageInput}
      />
      <IconButton
        label="下一步（→ / Space）"
        onClick={actions.next}
        disabled={
          index === deck.slides.length - 1 && state.step === slide.steps - 1
        }
      >
        <ArrowRight size={22} />
      </IconButton>
      <IconButton
        label="下一頁（Page Down）"
        secondary
        onClick={actions.nextSlide}
        disabled={index === deck.slides.length - 1}
      >
        <ChevronLast size={20} />
      </IconButton>
      <div className="control-divider" />
      <IconButton
        label={fullscreen ? '離開全螢幕（F）' : '全螢幕（F）'}
        onClick={onToggleFullscreen}
      >
        {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </IconButton>
      <IconButton label="簡報者模式（P）" onClick={onOpenPresenter}>
        <Monitor size={20} />
      </IconButton>
      <button
        type="button"
        className="icon-button"
        aria-label="操作說明（?）"
        title="操作說明（?）"
        ref={helpButton}
        onClick={onOpenHelp}
      >
        <HelpCircle size={20} />
      </button>
      {deck.Controls && (
        <deck.Controls {...runtime} openNavigator={onOpenNavigator} />
      )}
    </div>
  );
}
