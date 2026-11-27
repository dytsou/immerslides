# immerslides API

The project entry file imports the styles only once.

```tsx
import { createRoot } from 'react-dom/client';
import { Player } from 'immerslides/player';
import 'immerslides/styles.css';
import { deck } from './deck';

createRoot(document.getElementById('root')!).render(<Player deck={deck} />);
```

## Defining a deck

```tsx
import {
  defineDeck,
  fadeTransition,
  SlideFrame,
  ChapterGuide,
  Timeline,
  CodeBlock,
  type SlideRenderProps,
} from 'immerslides';

function RenderSlide(props: SlideRenderProps) {
  if (props.slide.id === 'opening') {
    return (
      <SlideFrame {...props} deck={deck} layout="cover" footer="Team talk">
        <h1>
          Every commit
          <br />
          gets feedback
        </h1>
        <p>CI presentation</p>
      </SlideFrame>
    );
  }
  if (props.slide.id === 'pipeline') {
    return (
      <SlideFrame {...props} deck={deck} footer="Team talk">
        <Timeline
          items={[
            { title: 'Commit', detail: 'Push the code' },
            {
              title: 'Check',
              detail: 'Run the tests automatically',
              tone: 'focus',
            },
            { title: 'Feedback', detail: 'Review the results', tone: 'good' },
          ]}
        />
      </SlideFrame>
    );
  }
  return (
    <SlideFrame {...props} deck={deck} footer="Team talk">
      <CodeBlock filename="test.sh">
        {'pnpm install --frozen-lockfile\npnpm test'}
      </CodeBlock>
    </SlideFrame>
  );
}

export const deck = defineDeck({
  id: 'ci-presentation',
  title: 'CI presentation',
  version: 1,
  size: { width: 1600, height: 900 },
  slides: [
    { id: 'opening', title: 'Every commit gets feedback', steps: 1 },
    { id: 'pipeline', title: 'Read the feedback flow at a glance', steps: 1 },
    { id: 'workflow', title: 'Run the tests from one config', steps: 1 },
  ],
  chapters: [
    { id: 'ci', title: 'CI · Continuous Integration', slideId: 'pipeline' },
  ],
  previews: [{ slideId: 'pipeline' }],
  transition: fadeTransition(0.25),
  Overlay: ChapterGuide,
  RenderSlide,
});
```

`SlideFrame` gets the title, page number, and chapter from `deck` and `slide`. It can be used for static previews and does not depend on the playback context. `layout` accepts `content`, `cover`, or `ending`. The default is `content`.

`ChapterGuide` uses a persistent overlay for smooth chapter transitions. `SlideFrame` keeps the chapter navigation in static previews. During playback, the overlay provides the navigation, which avoids a jump when the page changes.

`Timeline`'s `items` takes one to three nodes. Each node has a `title`, and it can have an optional `detail` and `tone`. `tone` supports `focus`, `good`, `warn`, and `bad`.

`CodeBlock`'s `children` is the raw code string. `filename` is an optional file-name label, and `language` sets the syntax or an alias. Code is rendered as text and never runs as HTML. For code and timeline examples with line-by-line focus, see [immersive.md](immersive.md).

## Playback and preview

`Player` takes `deck`. A valid slide URL takes priority when it chooses the slide and step. If no slide is specified, `fresh` set to `true` starts from the first slide; otherwise, progress saved in the same tab is restored. `homeHref` is optional and links back to a URL provided by the host project.

Press `O` to open the chapter and slide menu, which can switch between a tree-style text outline and thumbnails. The player remembers the last mode, and it persists after the menu closes and after a reload. Groups follow the starting `slideId` of each chapter in `chapters`: each chapter covers the slides up to the next chapter. Slides before the first chapter, and decks without chapters, are listed without chapter headings. Thumbnails share the static renderer.

A custom `DeckDefinition.Navigator` can get mark IDs from its own Provider and pass them to the public `SlideNavigator.markedSlides`. Marks use `ReadonlySet<SlideId>`, and `onToggleMark(id)` connects the existing mark action. The text and thumbnail views share the "Marked" filter, keep the original slide numbers, and hide empty chapters. When the mouse moves over a slide, or the slide receives keyboard focus, a star appears in its top-right corner so you can mark or unmark it. Touch devices show the star directly. Click the slide itself to view it.

When the current slide matches the filter, the list scrolls to it automatically. If it is not in the results, the list starts at the top. The filter only changes the navigator list and does not change the current playback position.

A custom `Controls` receives `PlayerControlsProps`, which includes the playback state and `openNavigator(filter?)`. Calling `openNavigator('marked')` opens the same navigator and filters it to the marked slides. Omitting the argument keeps the current filter. The starter's mark count uses this entry point.

`SlidePreview` takes `deck`, `slideId`, and an optional `step`. If `step` is omitted, it shows the final state of that slide. Previews do not start a playback provider.

Each slide's metadata can include `notes?: string`. Press `P` to show the current notes and the next view in the presenter window. See [presenter.md](presenter.md).

Each slide and chapter can set `slug?: string`. Use `getSlideHref(deck, id, step)` to build a link that opens directly. See [urls.md](urls.md).

A custom `RenderSlide` receives `slide`, `step`, `mode`, `active`, `still`, `reducedMotion`, `locale`, and `actions`. Use `actions.next()`, `previous()`, `nextSlide()`, `previousSlide()`, `jump(id)`, and `restart()` to move through the deck.

A custom transition ends at the final layout the renderer has already drawn, and it returns Web Animations API `Animation` objects (or an array of them) that finish in a finite time. The player cancels the animations when they finish or are interrupted, and it does not keep their fill effects. The final content and position must be determined by JSX and CSS. `capture` returns only geometry and styles that can be stored independently; it does not keep DOM nodes.

## Files and commands

Use the `package.json` that the generated project actually contains as the reference. The starter uses pnpm, Vite, React, and TypeScript, and provides `pnpm dev`, `pnpm typecheck`, and `pnpm build`. `packageManager` pins the pnpm version, and `pnpm-lock.yaml` locks the resolved dependencies.

When you add a slide, update `slides` and `RenderSlide` together. A chapter's `slideId` points to the first slide of that chapter. `previews` lists only the slides that need a static display.

## Multiple languages

The interfaces of the player, presenter view, navigator, and site support `zh-Hant` (the default) and `en`. Pass `locale` to `Player` or `Site`. If it is omitted, the outer `I18nProvider` is used; otherwise the interface falls back to `zh-Hant`.

```tsx
<Player deck={deck} locale="en" />
<Site deck={deck} locale="en" presentationHref="/slides/" />
```

Translations of slide titles, notes, chapters, and the handout go in `translations` in `defineDeck`, keyed by locale. `slides` and `chapters` match by ID, and numeric IDs use `String(id)`. Text without a translation uses the original content.

```tsx
export const deck = defineDeck({
  // ...
  translations: {
    en: {
      title: 'English talk',
      slides: { intro: { title: 'Opening', notes: 'Opening notes' } },
      chapters: { start: 'Start' },
      handout: { title: 'Handout', href: '/handout-en.pdf' },
    },
  },
});
```

Slugs and URLs are always generated from the original titles, so switching the language never changes a link. `RenderSlide` receives `locale`, and `SlideFrame` and `ChapterRail` apply translations automatically. Body JSX is not translated automatically. Branch on `locale`, or write one renderer per language. Custom components can call `useI18n()` to get the current `locale`, and use `t` for the built-in interface text.
