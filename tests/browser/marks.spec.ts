import { expect, type Page, test } from '@playwright/test';

const current = (page: Page) =>
  page.locator('.page-incoming > .stage-viewport > .immerslides-slide');
const marks = (page: Page) =>
  page.getByRole('button', { name: /^查看已標記頁面/ });
const star = (page: Page) =>
  page.getByRole('button', { name: '標記本頁重點', exact: true });
const navigator = (page: Page) =>
  page.getByRole('dialog', { name: '章節與投影片', exact: true });

async function openMarks(page: Page) {
  await marks(page).click();
  const panel = navigator(page);
  await expect(panel).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(
    panel.getByRole('button', { name: '已標記', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  return panel;
}

async function goToPage(page: Page, number: number) {
  const input = page.getByRole('spinbutton', { name: '投影片頁數' });
  await input.fill(String(number));
  await input.press('Enter');
  await expect(input).toHaveValue(String(number).padStart(2, '0'));
  await expect(page.locator('.page-outgoing')).toHaveCount(0);
}

test('opens the shared navigator with an empty marked filter and isolates playback shortcuts', async ({
  page,
}) => {
  await page.goto('/#/code-walkthrough?step=2');
  await expect(page.locator('.presentation-player')).toHaveAttribute(
    'data-ready',
    'true',
  );
  await expect(marks(page)).toHaveText('0');
  let panel = await openMarks(page);
  await expect(panel.getByRole('status')).toContainText('還沒有標記頁面');
  await expect(panel.locator('.slide-list [data-target]')).toHaveCount(0);
  await expect(panel.locator('summary')).toHaveCount(0);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type('15');
  await page.keyboard.press('PageDown');
  await page.keyboard.press('p');
  await page.keyboard.press('?');
  await expect(
    current(page).locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '1');
  await expect(
    page.getByRole('spinbutton', { name: '投影片頁數' }),
  ).toHaveValue('05');
  expect(page.context().pages()).toHaveLength(1);
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await panel.getByRole('button', { name: '全部', exact: true }).click();
  await expect(panel.locator('.slide-list [data-target]')).toHaveCount(16);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(marks(page)).toBeFocused();
  await page.keyboard.press('o');
  panel = navigator(page);
  await expect(
    panel.getByRole('button', { name: '全部', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await panel.getByRole('button', { name: '已標記', exact: true }).click();
  await expect(panel.getByRole('status')).toContainText('還沒有標記頁面');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: '章節與頁面（O）' }),
  ).toBeFocused();
  panel = await openMarks(page);
  await page.mouse.click(10, 10);
  await expect(panel).toHaveCount(0);
  await expect(marks(page)).toBeFocused();
});

test('filters both views in original page order, jumps, removes marks, and clears on restart', async ({
  page,
}) => {
  await page.goto('/#/code-walkthrough?step=2');
  await star(page).click();
  await goToPage(page, 4);
  await star(page).click();
  await expect(marks(page)).toHaveText('2');
  let panel = await openMarks(page);
  await panel.getByRole('button', { name: '文字大綱', exact: true }).click();
  const entries = panel.locator('.slide-list [data-target]');
  await expect(entries).toHaveText([
    '04沿著流程，一段一段理解',
    '05程式碼，跟著講解聚焦',
  ]);
  await expect(entries.nth(0)).toHaveAttribute('aria-current', 'page');
  await expect(panel.locator('summary')).toHaveCount(1);
  await panel.getByRole('button', { name: '縮圖預覽', exact: true }).click();
  await expect(
    panel.locator('.slide-list > li > .immerslides-preview'),
  ).toHaveCount(2);
  await expect(entries).toHaveText([
    '04沿著流程，一段一段理解',
    '05程式碼，跟著講解聚焦',
  ]);
  await page.screenshot({ path: 'artifacts/marked-pages-desktop.png' });
  await panel.getByRole('button', { name: '全部', exact: true }).click();
  await expect(entries).toHaveCount(16);
  await panel.getByRole('button', { name: '已標記', exact: true }).click();
  await expect(entries).toHaveCount(2);
  await entries
    .nth(1)
    .locator('..')
    .click({ position: { x: 30, y: 30 } });
  await expect(panel).toHaveCount(0);
  await expect(current(page)).toHaveAttribute('data-slide', 'code');
  await expect(page).toHaveURL(/#\/code-walkthrough$/);
  await expect(marks(page)).toBeFocused();
  await star(page).click();
  await expect(marks(page)).toHaveText('1');
  panel = await openMarks(page);
  await expect(panel.locator('.slide-list [data-target]')).toHaveText([
    '04沿著流程，一段一段理解',
  ]);
  await expect(panel.locator('.navigator-groups')).toHaveJSProperty(
    'scrollTop',
    0,
  );
  await page.keyboard.press('Escape');
  await page.keyboard.press('?');
  await page.getByRole('button', { name: '從頭開始', exact: true }).click();
  await expect(current(page)).toHaveAttribute('data-slide', 'cover');
  await expect(marks(page)).toHaveText('0');
  panel = await openMarks(page);
  await expect(panel.getByRole('status')).toContainText('還沒有標記頁面');
});

test('resets filtered scrolling when the current page is unmarked and centers it when marked', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.presentation-player')).toHaveAttribute(
    'data-ready',
    'true',
  );
  for (const number of [9, 10, 11, 12, 13, 14, 15, 16]) {
    await goToPage(page, number);
    await star(page).click();
  }
  await goToPage(page, 5);
  await page.keyboard.press('o');
  let panel = navigator(page);
  await panel.getByRole('button', { name: '縮圖預覽', exact: true }).click();
  await expect
    .poll(() =>
      panel
        .locator('.navigator-groups')
        .evaluate((element) => element.scrollTop),
    )
    .toBeGreaterThan(0);
  await panel.getByRole('button', { name: '已標記', exact: true }).click();
  await expect(panel.locator('.slide-list [data-target]')).toHaveCount(8);
  await expect(
    panel.locator('.slide-list [data-target][aria-current="page"]'),
  ).toHaveCount(0);
  await expect(panel.locator('.navigator-groups')).toHaveJSProperty(
    'scrollTop',
    0,
  );
  await panel.locator('[data-target="integration"]').click();
  await expect(current(page)).toHaveAttribute('data-slide', 'integration');
  panel = await openMarks(page);
  await expect(
    panel.locator('[data-target="integration"]').locator('..'),
  ).toBeInViewport({ ratio: 1 });
  await expect
    .poll(() =>
      panel
        .locator('.navigator-groups')
        .evaluate((element) => element.scrollTop),
    )
    .toBeGreaterThan(0);
  await expect(
    panel.getByRole('button', { name: '已標記', exact: true }),
  ).toBeInViewport({ ratio: 1 });
  await expect(
    panel.getByRole('button', { name: '關閉', exact: true }),
  ).toBeInViewport({ ratio: 1 });
  expect(await panel.evaluate((element) => element.scrollTop)).toBe(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({ path: 'artifacts/marked-pages-current-desktop.png' });
});

test('marks from the corner star in both all-page views without moving or closing the navigator', async ({
  page,
}) => {
  await page.goto('/#/15');
  await expect(page.locator('.presentation-player')).toHaveAttribute(
    'data-ready',
    'true',
  );
  await page.keyboard.press('o');
  const panel = navigator(page);
  await panel.getByRole('button', { name: '全部', exact: true }).click();
  const url = page.url();
  const historyLength = await page.evaluate(() => history.length);
  for (const name of ['文字大綱', '縮圖預覽']) {
    await panel.getByRole('button', { name, exact: true }).click();
    const card = panel.locator('[data-target="code"]').locator('..');
    const mark = card.locator(':scope > .navigator-mark');
    await mark.scrollIntoViewIfNeeded();
    await card.hover();
    await expect(card.getByRole('button')).toHaveCount(2);
    const scroll = await panel
      .locator('.navigator-groups')
      .evaluate((element) => element.scrollTop);
    await mark.click();
    await expect(mark).toHaveAttribute('aria-pressed', 'true');
    await expect(mark).toHaveAccessibleName(
      '取消標記頁面：程式碼，跟著講解聚焦（第 5 頁）',
    );
    await expect(mark).toBeFocused();
    expect(
      await panel
        .locator('.navigator-groups')
        .evaluate((element) => element.scrollTop),
    ).toBeCloseTo(scroll, 1);
    await expect(panel).toBeVisible();
    await expect(page).toHaveURL(url);
    if (name === '縮圖預覽')
      await page.screenshot({
        path: 'artifacts/navigator-mark-actions-desktop.png',
      });
    await mark.click();
    await expect(mark).toHaveAttribute('aria-pressed', 'false');
    await expect(mark).toBeFocused();
    expect(
      await panel
        .locator('.navigator-groups')
        .evaluate((element) => element.scrollTop),
    ).toBeCloseTo(scroll, 1);
    await expect(panel.locator('.slide-list [data-target]')).toHaveCount(16);
    await expect(page).toHaveURL(url);
  }
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  await expect(current(page)).toHaveAttribute('data-slide', 'integration');
});

test('unmarks in either marked-page view with focus retained and uses the row itself to jump', async ({
  page,
}) => {
  await page.goto('/#/code-walkthrough?step=2');
  await expect(page.locator('.presentation-player')).toHaveAttribute(
    'data-ready',
    'true',
  );
  await page.keyboard.press('o');
  const panel = navigator(page);
  await panel.getByRole('button', { name: '文字大綱', exact: true }).click();
  const markAt = async (id: string) => {
    const card = panel.locator(`[data-target="${id}"]`).locator('..');
    await card.hover();
    await card.locator(':scope > .navigator-mark').click();
  };
  await markAt('timeline');
  await markAt('code');
  const filter = panel.getByRole('button', { name: '已標記', exact: true });
  await filter.click();
  await expect(panel.locator('.slide-list [data-target]')).toHaveCount(2);
  await markAt('timeline');
  await expect(panel.locator('.slide-list [data-target]')).toHaveText([
    '05程式碼，跟著講解聚焦',
  ]);
  await expect(filter).toBeFocused();
  await expect(
    current(page).locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '1');
  await panel.getByRole('button', { name: '縮圖預覽', exact: true }).click();
  await markAt('code');
  await expect(panel.locator('.slide-list [data-target]')).toHaveCount(0);
  await expect(panel.getByRole('status')).toContainText('還沒有標記頁面');
  await expect(filter).toBeFocused();
  await expect(page).toHaveURL(/#\/code-walkthrough\?step=2$/);
  await panel.getByRole('button', { name: '全部', exact: true }).click();
  await markAt('timeline');
  await filter.click();
  const historyLength = await page.evaluate(() => history.length);
  await panel
    .locator('[data-target="timeline"]')
    .locator('..')
    .click({ position: { x: 30, y: 30 } });
  await expect(panel).toHaveCount(0);
  await expect(current(page)).toHaveAttribute('data-slide', 'timeline');
  await expect(page).toHaveURL(/#\/flow-walkthrough$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength + 1);
  await expect(
    page.getByRole('button', { name: '章節與頁面（O）' }),
  ).toBeFocused();
});

test('keeps the shared filter, thumbnail, and toolbar within a narrow viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/code-walkthrough?step=2');
  await star(page).click();
  const toolbar = await page.locator('.presentation-controls').boundingBox();
  expect(toolbar!.x).toBeGreaterThanOrEqual(0);
  expect(toolbar!.x + toolbar!.width).toBeLessThanOrEqual(390);
  for (const button of [marks(page), star(page)]) {
    const target = await button.boundingBox();
    expect(target!.width).toBeGreaterThanOrEqual(24);
    expect(target!.height).toBeGreaterThanOrEqual(24);
    expect(target!.x + target!.width).toBeLessThanOrEqual(390);
  }
  const panel = await openMarks(page);
  await panel.getByRole('button', { name: '縮圖預覽', exact: true }).click();
  const card = panel.locator('[data-target="code"]').locator('..');
  await expect(card).toBeInViewport({ ratio: 1 });
  await card.hover();
  const mark = card.locator(':scope > .navigator-mark');
  const markBounds = await mark.boundingBox();
  expect(markBounds!.width).toBeGreaterThanOrEqual(24);
  expect(markBounds!.height).toBeGreaterThanOrEqual(24);
  await expect(mark).toBeInViewport({ ratio: 1 });
  for (const name of ['文字大綱', '縮圖預覽', '全部', '已標記']) {
    const button = panel.getByRole('button', { name, exact: true });
    await expect(button).toBeInViewport({ ratio: 1 });
    const target = await button.boundingBox();
    expect(target!.width).toBeGreaterThanOrEqual(24);
    expect(target!.height).toBeGreaterThanOrEqual(24);
  }
  const bounds = await panel.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  expect(
    await panel.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
  ).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  expect(
    await page.locator('.nav-position > span').evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return new Set(
        Array.from(range.getClientRects(), (rect) => Math.round(rect.top)),
      ).size;
    }),
  ).toBe(1);
  await page.screenshot({ path: 'artifacts/marked-pages-mobile.png' });
  await mark.click();
  await expect(panel.getByRole('status')).toContainText('還沒有標記頁面');
  await expect(
    panel.getByRole('button', { name: '已標記', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await page.screenshot({ path: 'artifacts/marked-toolbar-mobile.png' });
});

test('reveals corner stars on hover or keyboard focus and hides mouse-focused stars after leaving', async ({
  page,
}) => {
  await page.goto('/#/code-walkthrough?step=2');
  await expect(page.locator('.presentation-player')).toHaveAttribute(
    'data-ready',
    'true',
  );
  await page.keyboard.press('o');
  const panel = navigator(page);
  for (const name of ['文字大綱', '縮圖預覽']) {
    await panel.getByRole('button', { name, exact: true }).click();
    const card = panel.locator('[data-target="code"]').locator('..');
    const mark = card.locator(':scope > .navigator-mark');
    await card.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await expect
      .poll(() =>
        mark.evaluate((element) =>
          element.checkVisibility({ checkOpacity: true }),
        ),
      )
      .toBe(false);
    await card.hover();
    await expect
      .poll(() =>
        mark.evaluate((element) =>
          element.checkVisibility({ checkOpacity: true }),
        ),
      )
      .toBe(true);
    await mark.click();
    await expect(mark).toHaveAttribute('aria-pressed', 'true');
    await page.mouse.move(0, 0);
    await expect
      .poll(() =>
        mark.evaluate((element) =>
          element.checkVisibility({ checkOpacity: true }),
        ),
      )
      .toBe(false);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(mark).toBeFocused();
    await expect
      .poll(() =>
        mark.evaluate((element) =>
          element.checkVisibility({ checkOpacity: true }),
        ),
      )
      .toBe(true);
    await page.keyboard.press('Space');
    await expect(mark).toHaveAttribute('aria-pressed', 'false');
    await expect(panel).toBeVisible();
    await expect(
      current(page).locator('.immerslides-code-walkthrough'),
    ).toHaveAttribute('data-step', '1');
  }
  await panel.getByRole('button', { name: '縮圖預覽', exact: true }).click();
  const timeline = panel.locator('[data-target="timeline"]').locator('..');
  await timeline.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect
    .poll(() =>
      timeline
        .locator(':scope > .navigator-mark')
        .evaluate((element) => element.checkVisibility({ checkOpacity: true })),
    )
    .toBe(false);
  await page.screenshot({
    path: 'artifacts/navigator-stars-at-rest-desktop.png',
  });
  await timeline.click({ position: { x: 30, y: 30 } });
  await expect(panel).toHaveCount(0);
  await expect(current(page)).toHaveAttribute('data-slide', 'timeline');
});

test('keeps touch stars available without hover', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto('/#/code-walkthrough?step=2');
    await expect(page.locator('.presentation-player')).toHaveAttribute(
      'data-ready',
      'true',
    );
    await page.getByRole('button', { name: '章節與頁面（O）' }).tap();
    const panel = navigator(page);
    await panel.getByRole('button', { name: '縮圖預覽', exact: true }).tap();
    const mark = panel
      .locator('[data-target="code"]')
      .locator('..')
      .locator(':scope > .navigator-mark');
    expect(
      await page.evaluate(
        () => matchMedia('(hover: none), (pointer: coarse)').matches,
      ),
    ).toBe(true);
    await expect
      .poll(() =>
        mark.evaluate((element) =>
          element.checkVisibility({ checkOpacity: true }),
        ),
      )
      .toBe(true);
    await mark.tap();
    await expect(mark).toHaveAttribute('aria-pressed', 'true');
    await expect(panel).toBeVisible();
    await panel.getByRole('button', { name: '已標記', exact: true }).tap();
    await expect(panel.locator('.slide-list [data-target]')).toHaveCount(1);
    await page.screenshot({ path: 'artifacts/marked-pages-touch.png' });
    await mark.tap();
    await expect(panel.getByRole('status')).toContainText('還沒有標記頁面');
    await expect(
      current(page).locator('.immerslides-code-walkthrough'),
    ).toHaveAttribute('data-step', '1');
  } finally {
    await context.close();
  }
});
