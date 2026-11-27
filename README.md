<p align="center">
  <img src="./starter/public/favicon.svg" alt="immerslides" width="128" height="128" />
</p>

# immerslides

![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![Node.js 26+](https://img.shields.io/badge/Node.js-26%2B-339933?logo=nodedotjs&logoColor=white)
![pnpm 12.20.0](https://img.shields.io/badge/pnpm-12.20.0-F69220?logo=pnpm&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

React presentations with immersive code and flow walkthroughs. Build slides from composable React components, step through code and flows one focus at a time, and publish the same deck as a scrolling reading site.

**English** | [繁體中文](README.zh-TW.md)

## Features

- **Full-page clicks.** One click advances to the next complete slide. Extra steps are added only where a talk needs them.
- **Immersive code walkthroughs.** `CodeBlock` shows highlighted code, and `CodeWindow` provides the window frame. Syntax highlighting covers languages such as TypeScript, Python, Java, SQL, JSON, YAML, Bash, HTML, and CSS.
- **Flow timelines.** `Timeline`, `FlowNode`, and `FlowConnector` show processes and their steps.
- **Presenter mode.** Press `P` to open a window with the current slide, the next slide, speaker notes, and a timer.
- **Slide navigator.** Press `O` to browse chapters and slides as an outline or as thumbnails, and filter by marked slides.
- **Shareable URLs.** Every slide and step has a hash URL, such as `/#/code-walkthrough?step=2`. URLs survive reloads and work with browser history.
- **Scrolling site view.** `Site` and `SiteStory` render the same deck as a long-form reading page.
- **Reduced motion.** When the user prefers reduced motion, transitions are disabled and all content stays visible.
- **Agent skill.** A bundled skill helps AI coding agents write and revise decks.

## Requirements

- Node.js 26 or later (see [`.nvmrc`](.nvmrc))
- pnpm 12.20.0 (pinned by the `packageManager` field)

```sh
nvm install
nvm use
npm install --global pnpm@12.20.0
pnpm install
```

## Quick start: run the demo

```sh
pnpm dev
```

Open the URL that Vite prints. By default this is `http://127.0.0.1:5173/`. The demo is a feature tour that covers layouts, flow diagrams, syntax highlighting, step-by-step focus, composition, presenter mode, and playback. Most slides advance with one click, and slides with extra steps are labeled.

The demo lives in [`starter/`](starter/):

- `/` shows the view set by `defaultView` in `starter/src/config.ts`.
- `/slides/` always shows the presentation.
- `/site/` always shows the scrolling site.

## Create a new presentation

The package is not yet published to npm. For now, pack this repository and create a project from the tarball:

```sh
pnpm pack --out immerslides.tgz
TARBALL="$PWD/immerslides.tgz"
node bin/immerslides.mjs create ../my-presentation
cd ../my-presentation
pnpm add "$TARBALL"
pnpm dev
```

The `create` command copies the starter project and the agent skill into a new directory. It refuses to write into a non-empty directory and does not install dependencies.

After the package is published, you will be able to run:

```sh
pnpm dlx immerslides create my-presentation
cd my-presentation
pnpm install
pnpm dev
```

## Use with an AI agent

New projects include the skill at `.agents/skills/immerslides/`. In an agent that supports project skills, invoke it with a prompt such as:

```text
$immerslides Turn this material into a CI talk.
One click should advance one full slide. Do not split a flow into one click per node.
```

The skill's source is [`skills/immerslides/SKILL.md`](skills/immerslides/SKILL.md), with reference documents in [`skills/immerslides/references/`](skills/immerslides/references/). To add the skill to an existing project, copy the whole `skills/immerslides` folder to `.agents/skills/immerslides` in that project.

## Use in a React project

Import the player and the styles once, then pass a deck to `Player`:

```tsx
import { Player } from 'immerslides/player';
import 'immerslides/styles.css';
import { deck } from './deck';

export function App() {
  return <Player deck={deck} />;
}
```

Define the deck with `defineDeck`. It sets the slide order, chapters, and a `RenderSlide` component:

```tsx
import { defineDeck, SlideFrame, type SlideRenderProps } from 'immerslides';

function RenderSlide(props: SlideRenderProps) {
  return (
    <SlideFrame {...props} deck={deck} footer="Team talk">
      <h1>Every commit gets feedback</h1>
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
    { id: 'pipeline', title: 'Read the pipeline at a glance', steps: 1 },
  ],
  previews: [{ slideId: 'opening' }],
  RenderSlide,
});
```

Use `steps: 1` for a normal slide, which advances with one click. Set a larger `steps` value only when a slide needs focus states. `steps` counts the initial state, so `steps: 2` gives the values `0` and `1`.

Each component has its own entry point, so you can import only what you need:

| Import | Provides |
| --- | --- |
| `immerslides` | Everything below, plus `usePlayback` and `useReducedMotion` |
| `immerslides/player` | `Player` |
| `immerslides/deck` | `defineDeck` and the deck types |
| `immerslides/site` | `Site`, `SiteStory`, `getSiteHref` |
| `immerslides/slide-frame`, `immerslides/chapter-guide` | `SlideFrame`, `ChapterGuide` |
| `immerslides/slide-navigator`, `immerslides/slide-preview` | `SlideNavigator`, `SlidePreview` |
| `immerslides/code-block`, `immerslides/code-window`, `immerslides/highlighted-code` | `CodeBlock`, `CodeWindow`, `HighlightedCode` |
| `immerslides/timeline`, `immerslides/flow-node`, `immerslides/flow-connector` | `Timeline`, `FlowNode`, `FlowConnector` |
| `immerslides/step-description` | `StepDescription` |
| `immerslides/styles.css` | Global styles. Import once. |

Standalone components such as `CodeWindow` and `FlowNode` work without the player. For full guides, see:

- [Authoring guide](skills/immerslides/references/authoring.md): deck definitions and the public API
- [Features](skills/immerslides/references/features.md): what each feature is for
- [Immersive walkthroughs](skills/immerslides/references/immersive.md): step-by-step code and flow focus
- [Composition](skills/immerslides/references/composition.md): custom layouts with the standalone components
- [Presenter mode](skills/immerslides/references/presenter.md): notes, next-slide preview, and timer
- [Slide URLs](skills/immerslides/references/urls.md): slugs, hash URLs, and `getSlideHref`
- [Site view](skills/immerslides/references/site.md): publishing the deck as a reading page

The reference documents are currently written in Chinese.

## Playback controls

| Key | Action |
| --- | --- |
| → or Space | Next step. By default, this advances to the next slide. |
| ← | Previous slide, or the previous explicitly defined step. |
| Page Down / Page Up | Jump to the next or previous full slide. |
| Digits, then Enter | Jump to a slide number. Esc cancels. |
| `O` | Open the chapter and slide navigator. |
| `F` | Toggle fullscreen. |
| `P` | Open or focus the presenter window. |
| `?` | Open the help dialog. |
| Esc | Close menus. |

Reloading restores the slide and step from the URL. If the URL does not name a slide, the player restores the progress saved in the same tab. Pass `fresh` to `Player` (`<Player deck={deck} fresh />`) to start from the beginning instead.

## Deploy

The production build is a static site with a page for the player (`/`, `/slides/`) and the reading view (`/site/`). Deploy the entire build output directory to any static host, and keep the subfolders intact.

## Development

Run these commands from the repository root:

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the demo deck |
| `pnpm build` | Build the library into `dist/` |
| `pnpm typecheck` | Run the TypeScript compiler without emitting files |
| `pnpm lint` | Run Biome checks for code, React rules, formatting, and import order |
| `pnpm lint:fix` | Apply the Biome fixes that are safe to apply automatically |
| `pnpm test` | Run unit tests with Vitest |
| `pnpm test:browser` | Run end-to-end tests with Playwright |
| `pnpm test:package` | Build the package and verify the installed result |
| `pnpm generate:favicon` | Regenerate the favicon |

Browser tests need a Chromium build for Playwright. Install it once with `pnpm exec playwright install --with-deps chromium`.

Project layout:

- `src/`: the library source (components, player, presenter, and site view)
- `bin/`: the `immerslides` CLI, which provides `create`
- `starter/`: the project template that the CLI copies, and the demo app for `pnpm dev`
- `skills/immerslides/`: the agent skill and its reference documents
- `tests/`: Vitest unit tests and Playwright browser tests
- `scripts/`: build, package smoke test, and favicon generation

## Continuous integration

Pull requests and pushes to `main` run [`verify.yml`](.github/workflows/verify.yml). It runs lint, type checks, unit tests, package verification, and the Chromium browser tests. CodeQL analyzes JavaScript and TypeScript. For private repositories, GitHub Code Security must be enabled first. Dependabot checks the root project, the starter, and GitHub Actions every week.

## Releasing

The **Release** workflow is started manually from `main`. It runs the shared verification, publishes to npm and GitHub Packages, and creates a GitHub Release.

Before the first release:

1. Create an `npm` environment in the GitHub repository that allows deployments only from `main`. Add required reviewers if you want a manual approval step.
2. Add an `NPM_TOKEN` secret to that environment. The token must be allowed to publish `immerslides`.
3. Make sure the repository's `GITHUB_TOKEN` can write packages, and that the organization allows packages under the scope.
4. Commit the version you want to release in `package.json`. The release creates the tag `v<version>`.

On GitHub Packages, the package is published as `@<repository-owner>/immerslides`. The scope uses the lowercase name of the repository owner. Both registries receive the same build.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
