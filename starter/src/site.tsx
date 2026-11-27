import { Site } from 'immerslides/site';
import { locale } from './config';
import { deck } from './deck';
import { mount } from './mount';

mount(<Site deck={deck} presentationHref="../slides/" locale={locale} />);
