import { expect, type Page, test } from '@playwright/test';

const current = (page: Page) =>
  page.locator('.page-incoming > .stage-viewport > .immerslides-slide');
const phase = (page: Page) =>
  current(page).locator('.immerslides-code-walkthrough');
const fragment = (page: Page, value: string) =>
  expect(page).toHaveURL((url) => decodeURIComponent(url.hash) === value);

test('opens numeric page URLs and phases and canonicalizes them to stable slugs', async ({
  page,
}) => {
  await page.goto('/#/5?step=2');
  await expect(current(page)).toHaveAttribute('data-slide', 'code');
  await expect(phase(page)).toHaveAttribute('data-step', '1');
  await fragment(page, '#/code-walkthrough?step=2');
  await expect(
    page.getByRole('spinbutton', { name: '投影片頁數' }),
  ).toHaveValue('05');
  await page.evaluate(() => {
    location.hash = '#/15';
  });
  await expect(current(page)).toHaveAttribute('data-slide', 'integration');
  await fragment(page, '#/把套件與製作流程一起帶走');
  await page.goBack();
  await expect(phase(page)).toHaveAttribute('data-step', '1');
  await page.goForward();
  await expect(current(page)).toHaveAttribute('data-slide', 'integration');
  await page.evaluate(() => {
    location.hash = '#/-1';
  });
  await expect(current(page)).toHaveAttribute('data-slide', 'cover');
  await fragment(page, '#/把想法-講清楚');
});

test('edits the current page number, validates on Enter, and cancels drafts on blur or Escape', async ({
  page,
}) => {
  await page.goto('/#/code-walkthrough?step=2');
  const input = page.getByRole('spinbutton', { name: '投影片頁數' });
  await expect(input).toHaveValue('05');
  await input.fill('15');
  await input.press('Escape');
  await expect(input).toHaveValue('05');
  await expect(input).not.toBeFocused();
  await input.fill('15');
  await current(page).click({ position: { x: 10, y: 10 } });
  await expect(input).toHaveValue('05');
  for (const invalid of ['', '0', '17', '1.5']) {
    await input.fill(invalid);
    await input.press('Enter');
    await expect(current(page)).toHaveAttribute('data-slide', 'code');
    await expect(phase(page)).toHaveAttribute('data-step', '1');
    expect(
      await input.evaluate(
        (element) => (element as HTMLInputElement).validity.valid,
      ),
    ).toBe(false);
    await input.press('Escape');
    await expect(input).toHaveValue('05');
  }
  await input.focus();
  await input.press('ArrowRight');
  await input.press('Space');
  await input.press('ArrowUp');
  await expect(current(page)).toHaveAttribute('data-slide', 'code');
  await expect(phase(page)).toHaveAttribute('data-step', '1');
  await input.press('Escape');
  await input.fill('15');
  await input.press('Enter');
  await expect(current(page)).toHaveAttribute('data-slide', 'integration');
  await expect(input).toHaveValue('15');
  await expect(input).not.toBeFocused();
  await fragment(page, '#/把套件與製作流程一起帶走');
});

test('types digits into the page input from the canvas while preserving editable text fields', async ({
  page,
}) => {
  await page.goto('/#/code-walkthrough?step=2');
  const input = page.getByRole('spinbutton', { name: '投影片頁數' });
  await page.keyboard.type('15');
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('15');
  await expect(phase(page)).toHaveAttribute('data-step', '1');
  await page.keyboard.press('Enter');
  await expect(current(page)).toHaveAttribute('data-slide', 'integration');
  await page.goBack();
  await expect(phase(page)).toHaveAttribute('data-step', '1');
  await page.evaluate(() => {
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', '');
    editor.setAttribute('aria-label', '測試編輯區');
    document.body.append(editor);
    editor.focus();
  });
  await page.keyboard.type('15');
  await expect(page.getByLabel('測試編輯區')).toHaveText('15');
  await expect(input).toHaveValue('05');
  await page.evaluate(() => {
    const field = document.createElement('input');
    field.setAttribute('aria-label', '測試輸入框');
    document.body.append(field);
    field.focus();
  });
  await page.keyboard.type('15');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('測試輸入框')).toHaveValue('15');
  await expect(current(page)).toHaveAttribute('data-slide', 'code');
  await expect(phase(page)).toHaveAttribute('data-step', '1');
  await expect(input).toHaveValue('05');
});

test('opens and reloads a slide phase, preserving the pathname and query', async ({
  page,
}) => {
  await page.goto('/?theme=light#/code-walkthrough?step=2');
  await expect(current(page)).toHaveAttribute('data-slide', 'code');
  await expect(phase(page)).toHaveAttribute('data-step', '1');
  await page.reload();
  await expect(phase(page)).toHaveAttribute('data-step', '1');
  await page.keyboard.press('ArrowRight');
  await fragment(page, '#/code-walkthrough?step=3');
  expect(new URL(page.url()).search).toBe('?theme=light');
  await page.goBack();
  await expect(phase(page)).toHaveAttribute('data-step', '1');
  await fragment(page, '#/code-walkthrough?step=2');
  await page.goForward();
  await expect(phase(page)).toHaveAttribute('data-step', '2');
  await page.evaluate(() =>
    history.replaceState(
      history.state,
      '',
      `/talk/index.html${location.search}${location.hash}`,
    ),
  );
  await page.keyboard.press('PageDown');
  await expect(current(page)).toHaveAttribute('data-slide', 'languages');
  expect(new URL(page.url()).pathname).toBe('/talk/index.html');
  expect(new URL(page.url()).search).toBe('?theme=light');
});

test('gives whole pages distinct history entries without a back and forward feedback loop', async ({
  page,
}) => {
  await page.goto('/');
  await expect(current(page)).toHaveAttribute('data-slide', 'cover');
  await fragment(page, '#/把想法-講清楚');
  const start = page.url();
  const historyLength = await page.evaluate(() => history.length);
  await page.keyboard.press('ArrowRight');
  await expect(current(page)).toHaveAttribute('data-slide', 'overview');
  const second = page.url();
  await page.keyboard.press('PageDown');
  await expect(current(page)).toHaveAttribute('data-slide', 'layouts');
  const third = page.url();
  expect(new Set([start, second, third]).size).toBe(3);
  expect(await page.evaluate(() => history.length)).toBe(historyLength + 2);
  await page.goBack();
  await expect(current(page)).toHaveAttribute('data-slide', 'overview');
  await expect(page).toHaveURL(second);
  await page.goBack();
  await expect(current(page)).toHaveAttribute('data-slide', 'cover');
  await expect(page).toHaveURL(start);
  await page.goForward();
  await expect(current(page)).toHaveAttribute('data-slide', 'overview');
  await expect(page).toHaveURL(second);
  expect(await page.evaluate(() => history.length)).toBe(historyLength + 2);
});

test('prioritizes direct links over saved progress and resumes progress without a fragment', async ({
  page,
}) => {
  await page.goto('/#/closing');
  await expect(current(page)).toHaveAttribute('data-slide', 'closing');
  await page.goto('/#/code-walkthrough?step=2');
  await expect(current(page)).toHaveAttribute('data-slide', 'code');
  await expect(phase(page)).toHaveAttribute('data-step', '1');
  await page.goto('/');
  await expect(current(page)).toHaveAttribute('data-slide', 'code');
  await expect(phase(page)).toHaveAttribute('data-step', '1');
  await fragment(page, '#/code-walkthrough?step=2');
  await page.goto('/#/unknown-slide');
  await expect(current(page)).toHaveAttribute('data-slide', 'cover');
  await fragment(page, '#/把想法-講清楚');
});

test('accepts outline and title slugs and follows authored links to a specific phase', async ({
  page,
}) => {
  await page.goto('/#/content');
  await expect(current(page)).toHaveAttribute('data-slide', 'overview');
  await fragment(page, '#/先看看-哪些能力適合你');
  await page.evaluate(() => {
    location.hash = '#/版型與內容';
  });
  await fragment(page, '#/先看看-哪些能力適合你');
  await page.evaluate(() => {
    location.hash = '#/程式碼-跟著講解聚焦';
  });
  await expect(current(page)).toHaveAttribute('data-slide', 'code');
  await fragment(page, '#/code-walkthrough');
  await page.goto('/#/urls');
  await expect(current(page)).toHaveAttribute('data-slide', 'urls');
  await current(page).locator('a[href="#/code-walkthrough?step=2"]').click();
  await expect(current(page)).toHaveAttribute('data-slide', 'code');
  await expect(phase(page)).toHaveAttribute('data-step', '1');
  await page.goBack();
  await expect(current(page)).toHaveAttribute('data-slide', 'urls');
});

test('recovers from malformed fragments and bounds invalid phase values', async ({
  page,
}) => {
  await page.goto('/#/code-walkthrough?step=999');
  await expect(phase(page)).toHaveAttribute('data-step', '2');
  await fragment(page, '#/code-walkthrough?step=3');
  await page.evaluate(() => {
    location.hash = '#/code-walkthrough?step=bad';
  });
  await expect(phase(page)).toHaveAttribute('data-step', '0');
  await fragment(page, '#/code-walkthrough');
  await page.evaluate(() => {
    location.hash = '#/%E0%A4%A';
  });
  await expect(current(page)).toHaveAttribute('data-slide', 'cover');
  await fragment(page, '#/把想法-講清楚');
  await page.goto('/#/%');
  await expect(current(page)).toHaveAttribute('data-slide', 'cover');
  await fragment(page, '#/把想法-講清楚');
});

test('updates the audience URL from controls, menus, chapter guide, presenter, and restart', async ({
  page,
}) => {
  await page.goto('/#/code');
  await fragment(page, '#/code-walkthrough');
  const popup = page.waitForEvent('popup');
  await page.getByRole('button', { name: '簡報者模式（P）' }).click();
  const presenter = await popup;
  await presenter.getByRole('button', { name: '下一步', exact: true }).click();
  await fragment(page, '#/code-walkthrough?step=2');
  expect(presenter.url()).toBe('about:blank');
  await page.getByRole('button', { name: '下一步（→ / Space）' }).click();
  await fragment(page, '#/code-walkthrough?step=3');
  await page.keyboard.press('o');
  await page.locator('.slide-list [data-target="timeline"]').click();
  await fragment(page, '#/flow-walkthrough');
  await page
    .locator('.immerslides-guide-overlay')
    .getByRole('button', { name: '03 擴充與重用' })
    .click();
  await fragment(page, '#/在播放核心之外-加入你的介面');
  await page.keyboard.press('?');
  await page.getByRole('button', { name: '從頭開始', exact: true }).click();
  await expect(current(page)).toHaveAttribute('data-slide', 'cover');
  await fragment(page, '#/把想法-講清楚');
  expect(presenter.url()).toBe('about:blank');
});
