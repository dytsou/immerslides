import { Player } from 'immerslides/player';
import { Site } from 'immerslides/site';
import { defaultView } from './config';
import { deck } from './deck';
import { mount } from './mount';

mount(
  defaultView === 'site' ? (
    <Site deck={deck} presentationHref="./slides/" />
  ) : (
    <Player deck={deck} />
  ),
);
