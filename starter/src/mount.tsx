import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import 'immerslides/styles.css';
import './styles.css';

export function mount(view: ReactNode) {
  createRoot(document.getElementById('root')!).render(view);
}
