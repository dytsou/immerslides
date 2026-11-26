import type { PresentationActions } from './types.js';

export function getNavigationAction(
  key: string,
  actions: PresentationActions,
): (() => void) | null {
  switch (key) {
    case 'ArrowRight':
    case ' ':
      return actions.next;
    case 'ArrowLeft':
      return actions.previous;
    case 'PageDown':
      return actions.nextSlide;
    case 'PageUp':
      return actions.previousSlide;
    default:
      return null;
  }
}
