import { Player } from 'immerslides/player';
import { Site } from 'immerslides/site';
import { defaultView, locale } from './config';
import { deck } from './deck';
import { mount } from './mount';

mount(
  defaultView === 'site' ? (
    <Site deck={deck} presentationHref="./slides/" locale={locale} />
  ) : (
    <Player deck={deck} locale={locale} />
  ),
);
