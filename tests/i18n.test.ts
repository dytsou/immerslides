import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { I18nProvider, useI18n } from '../src/i18n/context';
import { localizeDeck } from '../src/i18n/deck';
import { format, type MessageKey, messages } from '../src/i18n/messages';
import { Player } from '../src/index';
import { PlayerHelp } from '../src/presentation/PlayerHelp';
import { getSlideHref } from '../src/presentation/routing';
import { SlideNavigator } from '../src/presentation/SlideNavigator';
import { defineDeck, type SlideRenderProps } from '../src/presentation/types';
import { SlideFrame } from '../src/slides/SlideFrame';

function Opening({ slide, locale }: SlideRenderProps) {
  return h('h1', null, `${locale}:${slide.title}`);
}

function Probe() {
  const { locale, t } = useI18n();
  return h('span', null, `${locale}|${t('modal.close')}`);
}

const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe('messages', () => {
  it('keeps every key translated with the same placeholders', () => {
    const zh = messages['zh-Hant'];
    const en = messages.en;
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
    for (const key of Object.keys(zh) as MessageKey[]) {
      expect(en[key], key).not.toBe('');
      expect(placeholders(en[key]), key).toEqual(placeholders(zh[key]));
    }
  });

  it('fills placeholders and leaves unknown ones visible', () => {
    expect(format('Enter 1 to {total}', { total: 9 })).toBe('Enter 1 to 9');
    expect(format('{a} and {b}', { a: 'x' })).toBe('x and {b}');
  });
});

const talk = defineDeck({
  id: 'i18n-talk',
  title: '中文簡報',
  size: { width: 1600, height: 900 },
  slides: [
    { id: 'intro', title: '開場', steps: 1, notes: '開場備註' },
    { id: 0, title: '第二頁', steps: 2 },
  ],
  chapters: [{ id: 'start', title: '開始', slideId: 'intro' }],
  handout: { title: '講義', href: '/handout.pdf' },
  previews: [],
  translations: {
    en: {
      title: 'English talk',
      slides: {
        intro: { title: 'Opening', notes: 'Opening notes' },
        '0': { title: 'Second slide' },
      },
      chapters: { start: 'Start' },
      handout: { title: 'Handout', href: '/handout-en.pdf' },
    },
  },
  RenderSlide: Opening,
});

describe('localizeDeck', () => {
  it('returns the source deck when a locale has no translation', () => {
    expect(localizeDeck(talk, 'zh-Hant')).toBe(talk);
  });

  it('replaces titles, notes, chapters, and the handout', () => {
    const en = localizeDeck(talk, 'en');
    expect(en.title).toBe('English talk');
    expect(en.slides[0]).toMatchObject({
      id: 'intro',
      title: 'Opening',
      notes: 'Opening notes',
      steps: 1,
    });
    expect(en.slides[1]).toMatchObject({ id: 0, title: 'Second slide' });
    expect(en.chapters?.[0].title).toBe('Start');
    expect(en.handout).toEqual({ title: 'Handout', href: '/handout-en.pdf' });
    expect(talk.slides[0].title).toBe('開場');
  });

  it('caches per locale and treats a localized deck as its own source', () => {
    const en = localizeDeck(talk, 'en');
    expect(localizeDeck(talk, 'en')).toBe(en);
    expect(localizeDeck(en, 'en')).toBe(en);
    expect(localizeDeck(en, 'zh-Hant')).toBe(talk);
  });

  it('keeps links on the authored titles in every language', () => {
    const en = localizeDeck(talk, 'en');
    expect(getSlideHref(en, 'intro')).toBe(getSlideHref(talk, 'intro'));
    expect(getSlideHref(en, 0, 1)).toBe(getSlideHref(talk, 0, 1));
    expect(getSlideHref(talk, 'intro')).toBe('#/%E9%96%8B%E5%A0%B4');
  });
});

describe('defineDeck translations', () => {
  const base = {
    id: 'checked',
    title: 'Checked',
    size: { width: 1600, height: 900 },
    slides: [{ id: 'a', title: 'A', steps: 1 }],
    previews: [],
    RenderSlide: Opening,
  };

  it('rejects translations for unknown slides, chapters, and locales', () => {
    expect(() =>
      defineDeck({
        ...base,
        translations: { en: { slides: { missing: { title: 'x' } } } },
      }),
    ).toThrow(/unknown slide missing/);
    expect(() =>
      defineDeck({
        ...base,
        translations: { en: { chapters: { missing: 'x' } } },
      }),
    ).toThrow(/unknown chapter missing/);
    expect(() =>
      defineDeck({
        ...base,
        translations: { fr: { title: 'x' } } as never,
      }),
    ).toThrow(/unsupported locale: fr/);
  });
});

describe('rendered text', () => {
  it('uses the zh-Hant interface by default', () => {
    const html = renderToStaticMarkup(
      h(SlideNavigator, {
        deck: talk,
        selectedId: 'intro',
        onSelect: () => {},
        view: 'outline',
        onViewChange: () => {},
        filter: 'all',
        onFilterChange: () => {},
      }),
    );
    expect(html).toContain('投影片導覽');
    expect(html).toContain('文字大綱');
  });

  it('renders the English interface and localized text when asked', () => {
    const html = renderToStaticMarkup(
      h(
        I18nProvider,
        { locale: 'en' },
        h(SlideNavigator, {
          deck: localizeDeck(talk, 'en'),
          selectedId: 'intro',
          onSelect: () => {},
          view: 'outline',
          onViewChange: () => {},
          filter: 'all',
          onFilterChange: () => {},
        }),
      ),
    );
    expect(html).toContain('Slide navigator');
    expect(html).toContain('Outline');
    expect(html).toContain('Opening');
    expect(html).toContain('Start');
    expect(html).not.toContain('投影片導覽');
  });

  it('localizes the help panel and the slide frame', () => {
    const help = renderToStaticMarkup(
      h(
        I18nProvider,
        { locale: 'en' },
        h(PlayerHelp, { deck: localizeDeck(talk, 'en'), onRestart: () => {} }),
      ),
    );
    expect(help).toContain('Start over');
    expect(help).toContain('Handout');
    expect(help).toContain('/handout-en.pdf');

    const frame = renderToStaticMarkup(
      h(
        I18nProvider,
        { locale: 'en' },
        h(SlideFrame, {
          deck: talk,
          slide: talk.slides[0],
          children: h('p', null, 'body'),
        }),
      ),
    );
    expect(frame).toContain('Start');
    expect(frame).toContain('Opening');
    expect(frame).toContain('English talk');
  });

  it('passes the locale to slide renderers through Player', () => {
    const html = renderToStaticMarkup(
      h(Player, { deck: talk, locale: 'en', homeHref: '/home' }),
    );
    expect(html).toContain('en:Opening');
    expect(html).toContain('Back to home');
    expect(html).toContain('Next step (→ / Space)');
  });

  it('exposes the translator through useI18n', () => {
    const html = renderToStaticMarkup(
      h(I18nProvider, { locale: 'en' }, h(Probe)),
    );
    expect(html).toContain('en|Close');
  });
});
