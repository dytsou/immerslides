import { Site } from 'immerslides/site';
import { deck } from './deck';
import { mount } from './mount';

mount(<Site deck={deck} presentationHref="../slides/" />);
