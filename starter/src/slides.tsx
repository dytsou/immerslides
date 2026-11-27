import { Player } from 'immerslides/player';
import { locale } from './config';
import { deck } from './deck';
import { mount } from './mount';

mount(<Player deck={deck} locale={locale} />);
