---

name: immerslides-en
description: Build or revise a composable React immersive presentation with immerslides. Covers step-by-step focus for code and flows, syntax highlighting for many languages, the white-canvas style with blue chapter labels, the scrolling site view, and interfaces and content in multiple languages.
---

# immerslides

Turn the user's material into a playable, immersive presentation. Build on the package's playback core and slide style.

## Finding the project

- Read the project's `package.json` and any existing deck first. Keep the existing naming, content order, and the visual requirements the user has set.
- For a new project, use the package CLI: `immerslides create <directory>`. Until the package is published, use the local package or tarball the user provides. Do not assume a package with that name exists on the npm registry.
- Check the destination before creating anything. The CLI never overwrites a non-empty directory. When editing an existing presentation, change its content directly instead of recreating the project.
- For the public API and examples, read [authoring.md](references/authoring.md). Do not import the package's `src/` or the original reference site.
- When choosing advanced features or writing a feature overview, read [features.md](references/features.md). Use only the features that help the talk; a formal deck does not need every feature.
- When the user asks for line-by-line code explanations, focused flow steps, or syntax highlighting, read [immersive.md](references/immersive.md). Use the built-in controlled focus mode; do not build a second playback progress.
- When you need free layout or composed nodes, read [composition.md](references/composition.md). Use the public components and CSS layout directly, and keep the same step data.
- To import only some components, import from standalone entries such as `immerslides/code-window` or `immerslides/flow-node`. Import `defineDeck` and the slide types from `immerslides/deck`. The composition guide lists every entry. Do not import package internals.
- When you need speaker notes, a next-slide preview, or the presenter window, read [presenter.md](references/presenter.md). Keep plain-text speaker notes in each slide's `notes`; never draw them on the audience slide.
- For multiple languages, read the "Multiple languages" section of [authoring.md](references/authoring.md). Translate titles, notes, and chapters with `translations`, and pass `locale` to `Player` or `Site`. Links come from the authored titles, so do not create a separate slug for each language.
- For direct links, outlines, or title navigation, read [urls.md](references/urls.md). Use `slug` and `getSlideHref`; do not build a separate router or playback progress.
- To let readers scroll through the same deck, read [site.md](references/site.md). Use `Site` and `SiteStory`; do not copy the content or the step data.
- For starred marks and filters, read [authoring.md](references/authoring.md). They share the existing navigator and mark data, and they use the built-in star hover, keyboard, and touch behavior.
- Use pnpm, at the version pinned by the project's `packageManager` field. Keep `pnpm-lock.yaml`, and do not add a lockfile from another package manager. After publishing, the entry point for a new project is `pnpm dlx immerslides create <directory>`.

## Pacing pages and clicks

- First list the complete point each slide must make, then write the JSX. Keep the original facts and the necessary steps.
- The default is `steps: 1`, so one click shows the next complete slide. Do not split a sentence, an icon, or each flow node into its own click.
- A flow slide shows at most three nodes at a time. Carry a longer flow onto a continuation slide, keep the title, and label the continuation clearly.
- Add `steps` only when teaching needs comparison states or code focus. Use a few meaningful sections, not a click for every line.
- `steps` includes the initial state. For two visual states, use `steps: 2`, with `step` values `0` and `1`.
- Use stable slide IDs. When you change the structure of pages or steps, increase the deck's `version` so saved progress restores safely.
- For slides that will be shared long-term, set an explicit, unique `slug`. Use `getSlideHref` for links inside the content instead of building step parameters by hand.

## Continuing the presentation style

- Use `SlideFrame` as the page frame. Use the matching `layout` for the cover and the ending.
- Keep the 1600 × 900 canvas. Keep the white background, blue chapter labels, grey secondary text, large headings, and generous whitespace.
- Use `chapters` to build the chapter navigation. For smooth transitions, set `Overlay: ChapterGuide`. Do not keep a separate index of the current chapter.
- For main comparisons, use columns and thin dividers. Avoid wrapping every section in a tinted, rounded card.
- Use `Timeline` for flows. Use `CodeBlock` for code, and set its `language`. For line-by-line focus, define steps on meaningful sections and derive the slide's step count from the same array. Split longer content across continuation slides.
- Choose the layout to fit the content. Do not make every page the same three cards.
- Run timers and other side effects only during real playback. Keep previews static. Custom animation should respect `still` and `reducedMotion`.
- Do not turn numbers, quotations, or results without a source into verified facts.

## Checking the result

- Run `pnpm typecheck` and `pnpm build`. Run `pnpm install` if dependencies are missing. To reproduce with the existing lockfile, use `pnpm install --frozen-lockfile`.
- Play the built output in a browser. Confirm that one click advances a whole slide, and that extra steps appear only on slides where they were planned.
- Check the previous-slide control, the chapter menu, progress restored after a reload, and the keyboard controls.
- Check scaling, text, and chart clipping on desktop and narrow screens. Look at real screenshots instead of judging from a successful build alone.
- Turn on reduced motion and confirm the content is still complete and readable.
- Report the decks you changed, the checks you ran, and anything you have not verified. Publishing an npm package or deploying a site requires the user's explicit instruction.
