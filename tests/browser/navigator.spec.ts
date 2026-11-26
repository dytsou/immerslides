import { expect, type Page, test } from '@playwright/test';

const current = (page: Page) =>
  page.locator('.page-incoming > .stage-viewport > .immerslides-slide');

async function openNavigator(page: Page) {
  await expect(page.locator('.presentation-player')).toHaveAttribute(
    'data-ready',
    'true',
  );
  await page.keyboard.press('o');
  const dialog = page.getByRole('dialog', {
    name: '章節與投影片',
    exact: true,
  });
  await expect(dialog).toBeVisible();
  return dialog;
}

test('shows a chapter hierarchy, preserves every page, and collapses with native keyboard controls', async ({
  page,
}) => {
  await page.goto('/#/code-walkthrough?step=2');
  const dialog = await openNavigator(page);
  await dialog.getByRole('button', { name: '文字大綱', exact: true }).click();
  await expect(
    dialog.getByRole('button', { name: '文字大綱', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(dialog.locator('.slide-list [data-target]')).toHaveCount(16);
  await expect(
    dialog
      .getByRole('list', { name: '投影片', exact: true })
      .locator('[data-target]'),
  ).toHaveCount(1);
  await expect(dialog.locator('summary')).toHaveCount(3);
  await expect(dialog.getByText('未分章', { exact: true })).toHaveCount(0);
  const basics = dialog.getByRole('list', { name: '版型與內容', exact: true });
  expect(
    await basics
      .locator('[data-target]')
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('data-target')),
      ),
  ).toEqual([
    'overview',
    'layouts',
    'timeline',
    'code',
    'languages',
    'composition',
    'previews',
  ]);
  await expect(
    dialog
      .getByRole('list', { name: '播放與動態', exact: true })
      .locator('[data-target]'),
  ).toHaveCount(3);
  await expect(
    dialog
      .getByRole('list', { name: '擴充與重用', exact: true })
      .locator('[data-target]'),
  ).toHaveCount(5);
  await expect(basics.locator('[data-target="code"]')).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.screenshot({ path: 'artifacts/navigator-outline-desktop.png' });
  const summary = dialog.locator('summary').filter({ hasText: '版型與內容' });
  await summary.focus();
  await summary.press('Enter');
  await expect(basics).not.toBeVisible();
  await summary.press('Space');
  await expect(basics).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: '章節與頁面（O）' }),
  ).toBeFocused();
  await expect(
    current(page).locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '1');
});

test('previews still thumbnails and selects a page by clicking its image', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/#/code-walkthrough?step=2');
  const before = page.url();
  const dialog = await openNavigator(page);
  await dialog.getByRole('button', { name: '縮圖預覽', exact: true }).click();
  await expect(
    dialog.getByRole('button', { name: '縮圖預覽', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    dialog.locator('.slide-list > li > .immerslides-preview'),
  ).toHaveCount(16);
  const code = dialog.locator('[data-target="code"]');
  await expect(code).toHaveAttribute('aria-current', 'page');
  await expect(code.locator('button, a, input')).toHaveCount(0);
  const preview = code.locator('..').locator(':scope > .immerslides-preview');
  await expect(preview).toHaveAttribute('aria-hidden', 'true');
  await expect(preview).toHaveAttribute('inert', '');
  await expect(preview.locator('.immerslides-slide')).toHaveAttribute(
    'data-still',
    'true',
  );
  await expect(preview.locator('.immerslides-slide')).toHaveAttribute(
    'data-mode',
    'preview',
  );
  await expect(preview.locator('.immerslides-heading')).toHaveCSS(
    'display',
    'block',
  );
  await expect(
    preview.locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '2');
  await expect(page).toHaveURL(before);
  await page.screenshot({ path: 'artifacts/navigator-thumbnails-desktop.png' });
  const languages = dialog.locator('[data-target="languages"]').locator('..');
  await languages.scrollIntoViewIfNeeded();
  await languages.click({ position: { x: 30, y: 30 } });
  await expect(dialog).toHaveCount(0);
  await expect(current(page)).toHaveAttribute('data-slide', 'languages');
  await expect(page).toHaveURL(
    (url) => decodeURIComponent(url.hash) === '#/熟悉的語言-保留語法色彩',
  );
  await page.goBack();
  await expect(
    current(page).locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '1');
  expect(errors).toEqual([]);
});

test('keeps thumbnail navigation within a narrow viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/15');
  const dialog = await openNavigator(page);
  await dialog.getByRole('button', { name: '縮圖預覽', exact: true }).click();
  await expect(dialog.locator('[data-target="integration"]')).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(
    dialog.locator('[data-target="integration"]').locator('..'),
  ).toBeInViewport({ ratio: 1 });
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
  ).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({ path: 'artifacts/navigator-thumbnails-mobile.png' });
  await dialog.getByRole('button', { name: '文字大綱', exact: true }).click();
  await expect(dialog.locator('.immerslides-preview')).toHaveCount(0);
  await expect(dialog.locator('[data-target="integration"]')).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('opens at the current page while keeping view controls and the close button visible', async ({
  page,
}) => {
  await page.goto('/#/15');
  await expect(current(page)).toHaveAttribute('data-slide', 'integration');
  const url = page.url();
  let dialog = await openNavigator(page);
  await dialog.getByRole('button', { name: '文字大綱', exact: true }).click();
  const checkPosition = async () => {
    await expect(
      dialog.locator('[data-target="integration"]').locator('..'),
    ).toBeInViewport({ ratio: 1 });
    await expect(
      dialog.getByRole('button', { name: '文字大綱', exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await expect(
      dialog.getByRole('button', { name: '縮圖預覽', exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await expect(
      dialog.getByRole('button', { name: '關閉', exact: true }),
    ).toBeInViewport({ ratio: 1 });
    expect(await dialog.evaluate((element) => element.scrollTop)).toBe(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page).toHaveURL(url);
  };
  await checkPosition();
  await dialog.getByRole('button', { name: '縮圖預覽', exact: true }).click();
  await checkPosition();
  await page.keyboard.press('Escape');
  dialog = await openNavigator(page);
  await expect(
    dialog.getByRole('button', { name: '縮圖預覽', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await checkPosition();
  await page.screenshot({
    path: 'artifacts/navigator-current-page-desktop.png',
  });
});

test('remembers each view choice after closing, reopening, and reloading', async ({
  page,
}) => {
  await page.goto('/#/code-walkthrough?step=2');
  for (const name of ['縮圖預覽', '文字大綱']) {
    let dialog = await openNavigator(page);
    await dialog.getByRole('button', { name, exact: true }).click();
    await page.keyboard.press('Escape');
    dialog = await openNavigator(page);
    await expect(
      dialog.getByRole('button', { name, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    dialog = await openNavigator(page);
    await expect(
      dialog.getByRole('button', { name, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      dialog.locator('.slide-list > li > .immerslides-preview'),
    ).toHaveCount(name === '縮圖預覽' ? 16 : 0);
    await page.keyboard.press('Escape');
  }
  await expect(
    current(page).locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '1');
});

test('keeps the view after reopening even when local storage is unavailable', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage blocked', 'SecurityError');
      },
    });
  });
  await page.goto('/#/code-walkthrough?step=2');
  let dialog = await openNavigator(page);
  await dialog.getByRole('button', { name: '縮圖預覽', exact: true }).click();
  await page.keyboard.press('Escape');
  dialog = await openNavigator(page);
  await expect(
    dialog.getByRole('button', { name: '縮圖預覽', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    dialog.locator('.slide-list > li > .immerslides-preview'),
  ).toHaveCount(16);
  await page.keyboard.press('Escape');
  await expect(
    current(page).locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '1');
  expect(errors).toEqual([]);
});
