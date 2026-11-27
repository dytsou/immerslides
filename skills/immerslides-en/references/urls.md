# Open slides by URL

Every slide has its own fragment URL. Normal page changes and step changes update the URL and the browser history. Using back, forward, or reload returns to the same slide and step.

For example, `/#/code-walkthrough?step=2` opens the second step of the code slide. The original site path and query parameters are kept, so direct links also work on a static host.

## Setting a slug

```tsx
const deck = defineDeck({
  id: 'my-talk',
  title: 'Tech talk',
  size: { width: 1600, height: 900 },
  slides: [
    { id: 'opening', title: 'Before we start', slug: 'opening', steps: 1 },
    {
      id: 'code',
      title: 'Understand the code step by step',
      slug: 'code-walkthrough',
      steps: codeSteps.length,
    },
  ],
  chapters: [
    {
      id: 'intro',
      title: 'Basic concepts',
      slug: 'basics',
      slideId: 'opening',
    },
  ],
  previews: [{ slideId: 'code' }],
  RenderSlide,
});
```

If no slug is set, one is generated from the title. English is lowercased, spaces and punctuation are collapsed into hyphens, and Unicode text such as Chinese is kept. Duplicate titles get a stable slide ID added to tell them apart.

When a link must stay valid for a long time, set `slug` explicitly. Changing the title will then not change that slide's main URL.

## Jumping to a page by number

`#/15` goes to slide 15, and `#/5?step=2` goes to the second step of slide 5. Slide numbers start at 1 and follow the order of the `slides` array. After a page change, the URL is normalized to that slide's main slug.

During playback, type a number and press Enter to jump. You can also click the current page number below to edit it. Press Esc or leave the input to cancel editing. Empty, decimal, and out-of-range entries do not change the page. While you are editing another text field, number keys do not trigger a jump.

Numeric URLs are reserved for page numbers. Numeric slide IDs are not used as URL aliases, and a title that is only digits gets a `slide-` prefix. A custom slide or chapter slug must contain something other than digits, such as `chapter-1`. Page numbers change when the slide order changes, so use explicit slugs for links you share long-term.

## Jumping by title or outline

A non-numeric slide ID, a slug generated from a title, a chapter title, or an explicitly set slug can all be used to find the matching slide. A chapter goes to its first slide.

In the example above, the main links are `#/opening` and `#/code-walkthrough`. You can also use `#/basic-concepts` or `#/basics` to go to the chapter's first slide.

An automatic alias that cannot be matched to exactly one slide does not send the reader to some other slide. If two explicit slugs conflict, `defineDeck` reports an error when the deck is created.

## Linking from content

```tsx
import { getSlideHref } from 'immerslides';

<a href={getSlideHref(deck, 'code', 1)}>Go to the second step of the code</a>;
```

`getSlideHref(deck, slideId, step = 0)` returns a fragment string. The `step` argument of the function starts at 0, as it does in the player, while the `step` in the URL starts at 1. The first step omits the step parameter from the URL.

A valid slide URL takes priority over saved playback progress and `fresh`. When no slide is specified, `fresh` or the progress saved in the tab applies. An invalid slide URL falls back to the first slide, a malformed step falls back to the first step, and an out-of-range integer step is clamped to the valid range.

The presenter window shares the playback state of the audience window. Actions taken in the presenter window also update the URL of the audience window.
