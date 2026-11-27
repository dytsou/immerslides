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
import { useI18n } from '../i18n/context.js';
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
  const { t } = useI18n();
  return (
    <div
      className={`presentation-controls projection-controls ${visible ? 'visible' : ''}`}
      onFocus={onFocus}
    >
      {homeHref && (
        <a
          href={homeHref}
          className="icon-button"
          aria-label={t('toolbar.home')}
          title={t('toolbar.home')}
        >
          <Home size={20} />
        </a>
      )}
      <button
        type="button"
        className="icon-button"
        aria-label={t('toolbar.navigator')}
        title={t('toolbar.navigator')}
        ref={menuButton}
        onClick={() => onOpenNavigator()}
      >
        <Grid2X2 size={20} />
      </button>
      <div className="control-divider" />
      <IconButton
        label={t('toolbar.previousSlide')}
        secondary
        onClick={actions.previousSlide}
        disabled={index === 0}
      >
        <ChevronFirst size={20} />
      </IconButton>
      <IconButton
        label={t('toolbar.previousStep')}
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
        label={t('toolbar.nextStep')}
        onClick={actions.next}
        disabled={
          index === deck.slides.length - 1 && state.step === slide.steps - 1
        }
      >
        <ArrowRight size={22} />
      </IconButton>
      <IconButton
        label={t('toolbar.nextSlide')}
        secondary
        onClick={actions.nextSlide}
        disabled={index === deck.slides.length - 1}
      >
        <ChevronLast size={20} />
      </IconButton>
      <div className="control-divider" />
      <IconButton
        label={
          fullscreen ? t('toolbar.exitFullscreen') : t('toolbar.fullscreen')
        }
        onClick={onToggleFullscreen}
      >
        {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </IconButton>
      <IconButton label={t('toolbar.presenter')} onClick={onOpenPresenter}>
        <Monitor size={20} />
      </IconButton>
      <button
        type="button"
        className="icon-button"
        aria-label={t('toolbar.help')}
        title={t('toolbar.help')}
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
