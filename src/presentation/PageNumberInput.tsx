import type { RefObject } from 'react';
import { useI18n } from '../i18n/context.js';
import type { DeckDefinition, PresentationActions } from './types.js';

type PageNumberInputProps = {
  deck: DeckDefinition;
  index: number;
  onJump: PresentationActions['jump'];
  inputRef: RefObject<HTMLInputElement | null>;
};

export function PageNumberInput({
  deck,
  index,
  onJump,
  inputRef,
}: PageNumberInputProps) {
  const { t } = useI18n();
  return (
    <form
      className="nav-position"
      onSubmit={(event) => {
        event.preventDefault();
        const input = inputRef.current!;
        const page = input.valueAsNumber;
        if (
          !input.validity.valid ||
          !Number.isSafeInteger(page) ||
          !deck.slides[page - 1]
        )
          return;
        onJump(deck.slides[page - 1].id);
        input.blur();
      }}
    >
      <input
        key={index}
        ref={inputRef}
        type="number"
        min={1}
        max={deck.slides.length}
        step={1}
        required
        defaultValue={String(index + 1).padStart(2, '0')}
        aria-label={t('page.label')}
        title={t('page.hint', { total: deck.slides.length })}
        style={{ width: `${Math.max(2, String(deck.slides.length).length)}ch` }}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={(event) => {
          event.currentTarget.value = String(index + 1).padStart(2, '0');
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
      />
      <span>/ {deck.slides.length}</span>
    </form>
  );
}
