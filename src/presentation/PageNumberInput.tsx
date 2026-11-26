import type { RefObject } from 'react';
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
        aria-label="投影片頁數"
        title={`輸入 1 到 ${deck.slides.length}，按 Enter 跳頁，Esc 取消`}
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
