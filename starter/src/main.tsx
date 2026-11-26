import { Player } from 'immerslides/player';
import { createRoot } from 'react-dom/client';
import 'immerslides/styles.css';
import { deck } from './deck';
import './styles.css';

createRoot(document.getElementById('root')!).render(<Player deck={deck} />);
