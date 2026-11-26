import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';

const slides = [
  'cover',
  'overview',
  'layouts',
  'timeline',
  'code',
  'languages',
  'composition',
  'previews',
  'steps',
  'navigation',
  'motion',
  'extensions',
  'presenter',
  'urls',
  'integration',
  'closing',
];
const section = (page: Page, id: string) =>
  page.locator(`.immersite-page[data-page="${id}"]`);
const front = (page: Page) => page.locator('.immersite-page[data-front]');
const story = (page: Page) => section(page, 'code').locator('.immersite-story');
const scrollY = (page: Page) => page.evaluate(() => window.scrollY);
const fragment = (page: Page) =>
  page.evaluate(() => decodeURIComponent(window.location.hash));
const pageTop = (page: Page, id: string) =>
  section(page, id)
    .locator('.immersite-anchor')
    .evaluate((anchor) => anchor.getBoundingClientRect().top + window.scrollY);
const scrollTo = (page: Page, top: number) =>
  page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), top);

async function open(page: Page, path = '/site/') {
  await page.goto(path);
  await expect(page.locator('.immersite[data-ready]')).toBeAttached();
}

test('renders every slide of the deck in order without the player', async ({
  page,
}) => {
  await open(page);
  expect(
    await page
      .locator('.immersite-page')
      .evaluateAll((pages) =>
        pages.map((page) => (page as HTMLElement).dataset.page),
      ),
  ).toEqual(slides);
  for (const id of slides)
    await expect(
      section(page, id).locator(`.immerslides-slide[data-slide="${id}"]`),
    ).toBeAttached();
  await expect(page.locator('.immerslides-player')).toHaveCount(0);
  await expect(page.locator('.presentation-controls')).toHaveCount(0);
  await expect(front(page)).toHaveAttribute('data-page', 'cover');
  await expect(page).toHaveTitle('把想法，講清楚 · 沉浸式簡報功能導覽');
  await page.screenshot({ path: 'artifacts/site-cover-desktop.png' });
});

test('advances code steps in short scroll distances and reverses them', async ({
  page,
}) => {
  await open(page, '/site/#code-walkthrough');
  const start = await scrollY(page);
  const stage = section(page, 'code').locator('.immersite-stage');
  const focused = section(page, 'code').locator(
    '.immerslides-code-line[data-focused="true"]',
  );
  await expect(story(page)).toHaveAttribute('data-step', '0');
  await page.mouse.move(500, 500);
  await page.mouse.wheel(0, 300);
  await expect(story(page)).toHaveAttribute('data-step', '1');
  await expect(focused.first()).toHaveAttribute('data-line', '6');
  await page.mouse.wheel(0, 300);
  await expect(story(page)).toHaveAttribute('data-step', '2');
  await expect(focused.first()).toHaveAttribute('data-line', '12');
  expect(await scrollY(page)).toBe(start + 600);
  expect(
    await stage.evaluate((stage) => stage.getBoundingClientRect().top),
  ).toBe(0);
  await page.mouse.wheel(0, -300);
  await expect(story(page)).toHaveAttribute('data-step', '1');
  await page.mouse.wheel(0, -300);
  await expect(story(page)).toHaveAttribute('data-step', '0');
  await page.screenshot({ path: 'artifacts/site-code-desktop.png' });
});

test('keeps shared elements fixed while the content moves through a transition', async ({
  page,
}) => {
  await page.addInitScript(() =>
    window.addEventListener('scrollend', (event) => event.stopPropagation(), {
      capture: true,
    }),
  );
  await open(page, '/site/#code-walkthrough');
  const code = section(page, 'code');
  const top = (selector: string) =>
    code
      .locator(selector)
      .first()
      .evaluate((element) => element.getBoundingClientRect().top);
  const rail = await top('.immerslides-rail');
  const footer = await top('.immerslides-footer');
  const heading = await top('.immerslides-heading');
  const end = (await pageTop(page, 'code')) + 600;
  await scrollTo(page, end + 400);
  await expect(section(page, 'languages')).toHaveAttribute('data-visible');
  await expect(code).toHaveAttribute('data-visible');
  await expect.poll(() => top('.immerslides-heading')).toBe(heading - 400);
  expect(await top('.immerslides-rail')).toBe(rail);
  expect(await top('.immerslides-footer')).toBe(footer);
  expect(
    await section(page, 'languages')
      .locator('.immerslides-heading')
      .evaluate((element) => element.getBoundingClientRect().top),
  ).toBe(heading + 600);
  await scrollTo(page, end + 600);
  await expect(front(page)).toHaveAttribute('data-page', 'languages');
  await scrollTo(page, end + 200);
  await expect(front(page)).toHaveAttribute('data-page', 'code');
  await expect(story(page)).toHaveAttribute('data-step', '2');
});

test('snaps a stopped transition to the nearer complete page and keeps later scrolling', async ({
  page,
}) => {
  await open(page, '/site/#code-walkthrough');
  const end = (await pageTop(page, 'code')) + 600;
  const languages = await pageTop(page, 'languages');
  expect(languages).toBe(end + 1000);
  await scrollTo(page, end);
  await page.mouse.move(500, 500);
  await page.mouse.wheel(0, 350);
  await expect.poll(() => scrollY(page)).toBe(end);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => scrollY(page)).toBe(languages);
  await expect(front(page)).toHaveAttribute('data-page', 'languages');
  await expect.poll(() => fragment(page)).toBe('#熟悉的語言-保留語法色彩');
  await scrollTo(page, end);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => scrollY(page)).toBeGreaterThan(end + 700);
  await page.mouse.wheel(0, 1700);
  await expect(front(page)).toHaveAttribute('data-page', 'composition');
  const composition = await pageTop(page, 'composition');
  await expect
    .poll(async () => {
      const y = await scrollY(page);
      return y >= composition && y <= composition + 600;
    })
    .toBe(true);
});

test('jumps from the chapter rail and returns with browser history', async ({
  page,
}) => {
  await open(page, '/site/#flow-walkthrough');
  await section(page, 'timeline')
    .locator('.immerslides-rail')
    .getByRole('button', { name: /播放與動態/ })
    .click();
  await expect(front(page)).toHaveAttribute('data-page', 'steps');
  await expect.poll(() => scrollY(page)).toBe(await pageTop(page, 'steps'));
  await expect.poll(() => fragment(page)).toBe('#一次一頁-需要時才分段');
  await page.goBack();
  await expect(front(page)).toHaveAttribute('data-page', 'timeline');
  await expect.poll(() => scrollY(page)).toBe(await pageTop(page, 'timeline'));
  await page.goForward();
  await expect(front(page)).toHaveAttribute('data-page', 'steps');
});

test('opens sections directly, survives reloads, and follows hash navigation', async ({
  page,
}) => {
  await open(page, '/site/#code-walkthrough');
  await expect(front(page)).toHaveAttribute('data-page', 'code');
  expect(await scrollY(page)).toBe(await pageTop(page, 'code'));
  await page.reload();
  await expect(page.locator('.immersite[data-ready]')).toBeAttached();
  await expect(front(page)).toHaveAttribute('data-page', 'code');
  expect(await scrollY(page)).toBe(await pageTop(page, 'code'));
  await page.evaluate(() => {
    window.location.hash = '#15';
  });
  await expect(front(page)).toHaveAttribute('data-page', 'integration');
  await expect.poll(() => fragment(page)).toBe('#把套件與製作流程一起帶走');
  await page.goBack();
  await expect(front(page)).toHaveAttribute('data-page', 'code');
  await page.goForward();
  await expect(front(page)).toHaveAttribute('data-page', 'integration');
  await open(page, '/site/#urls');
  await section(page, 'urls')
    .getByRole('link', { name: '開啟程式碼第二段' })
    .click();
  await expect(front(page)).toHaveAttribute('data-page', 'code');
  await expect(story(page)).toHaveAttribute('data-step', '1');
  await expect.poll(() => fragment(page)).toBe('#code-walkthrough');
});

test('links the current section and step to the presentation entry', async ({
  page,
}) => {
  await open(page, '/site/#code-walkthrough?step=2');
  await expect(story(page)).toHaveAttribute('data-step', '1');
  const link = page.getByRole('link', { name: '放映簡報' });
  await expect(link).toHaveAttribute(
    'href',
    '../slides/#/code-walkthrough?step=2',
  );
  await link.click();
  await expect(page).toHaveURL(/\/slides\/#\/code-walkthrough\?step=2$/);
  const slide = page.locator(
    '.page-incoming > .stage-viewport > .immerslides-slide',
  );
  await expect(slide).toHaveAttribute('data-slide', 'code');
  await expect(slide.locator('.immerslides-code-walkthrough')).toHaveAttribute(
    'data-step',
    '1',
  );
  await expect(page.locator('.immersite')).toHaveCount(0);
});

test('stops loops that leave the viewport', async ({ page }) => {
  await open(page);
  const dot = section(page, 'motion').locator('.demo-motion-track span');
  const animation = () =>
    dot.evaluate((element) => getComputedStyle(element).animationName);
  expect(await animation()).toBe('none');
  await page.evaluate(() => {
    window.location.hash = '#motion';
  });
  await expect(front(page)).toHaveAttribute('data-page', 'motion');
  await expect.poll(animation).toBe('demo-travel');
  await page.evaluate(() => {
    window.location.hash = '#closing';
  });
  await expect.poll(animation).toBe('none');
});

test('serves the fixed presentation entry and the configured home view', async ({
  page,
}) => {
  await page.goto('/slides/');
  await expect(page.locator('.immerslides-player')).toBeVisible();
  await expect(page.locator('.immersite')).toHaveCount(0);
  await page.keyboard.press('?');
  const handout = page.getByRole('link', { name: '功能速查講義' });
  expect(
    await handout.evaluate(
      (link) => new URL((link as HTMLAnchorElement).href).pathname,
    ),
  ).toBe('/handout.html');
  expect(
    (
      await page.request.get(
        await handout.evaluate((link) => (link as HTMLAnchorElement).href),
      )
    ).ok(),
  ).toBe(true);
  const config = readFileSync('starter/src/config.ts', 'utf8');
  const view = /defaultView[^=]*=\s*'(slides|site)'/.exec(config)![1];
  await page.goto('/');
  await expect(
    page.locator(view === 'site' ? '.immersite' : '.immerslides-player'),
  ).toBeAttached();
  await expect(
    page.locator(view === 'site' ? '.immerslides-player' : '.immersite'),
  ).toHaveCount(0);
});

test('stacks complete, static pages under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/site/#code-walkthrough');
  const code = section(page, 'code');
  expect(
    await code
      .locator('.immersite-stage')
      .evaluate((stage) => getComputedStyle(stage).position),
  ).not.toBe('sticky');
  await expect(code.locator('.immersite-story-steps li')).toHaveCount(3);
  await expect(
    code.locator('.immersite-story-steps li[aria-current="step"]'),
  ).toContainText('最後完成送出');
  await expect(code.locator('.immerslides-step-explanation')).toBeHidden();
  await expect(section(page, 'steps').locator('.demo-reveal')).toBeAttached();
  expect(
    await section(page, 'steps')
      .locator('.demo-reveal')
      .evaluate((element) => getComputedStyle(element).visibility),
  ).toBe('visible');
  const top = await pageTop(page, 'code');
  expect(await scrollY(page)).toBe(top);
  await scrollTo(page, top + 300);
  await page.waitForTimeout(300);
  expect(await scrollY(page)).toBe(top + 300);
  await page.screenshot({ path: 'artifacts/site-reduced-desktop.png' });
});

test.describe('phone width', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('never overflows the page and scrolls code inside its own region', async ({
    page,
  }) => {
    await open(page, '/site/#code-walkthrough');
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBe(0);
    await expect(
      section(page, 'code').locator('.immerslides-rail'),
    ).toBeHidden();
    const pre = section(page, 'code').locator('pre');
    expect(
      await pre.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      ),
    ).toBe(true);
    await pre.evaluate((element) => {
      element.scrollLeft = 120;
    });
    expect(await pre.evaluate((element) => element.scrollLeft)).toBeGreaterThan(
      0,
    );
    await page.mouse.move(195, 400);
    await page.mouse.wheel(0, 253);
    await expect(story(page)).toHaveAttribute('data-step', '1');
    await page.screenshot({ path: 'artifacts/site-code-phone.png' });
  });
});
