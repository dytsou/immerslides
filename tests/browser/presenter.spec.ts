import { expect, type Page, test } from '@playwright/test';

const current = (page: Page) =>
  page.locator('.page-incoming > .stage-viewport > .immerslides-slide');
const coverNotes = '介紹 immerslides 的功能與操作。\n按 P 開啟簡報者模式。';

async function openPresenter(page: Page) {
  const popup = page.waitForEvent('popup');
  await page.getByRole('button', { name: '簡報者模式（P）' }).click();
  const presenter = await popup;
  await expect(
    presenter.getByRole('heading', { name: '目前投影片', exact: true }),
  ).toBeVisible();
  return presenter;
}

async function jump(page: Page, id: string) {
  await page.keyboard.press('o');
  await page.locator(`.slide-list [data-target="${id}"]`).click();
  await expect(current(page)).toHaveAttribute('data-slide', id);
}

test('opens one styled presenter window with private notes and a still next preview', async ({
  page,
  context,
}) => {
  await page.goto('/');
  const presenter = await openPresenter(page);
  await expect(presenter).toHaveTitle(/簡報者模式 · immerslides$/);
  await expect(
    presenter.getByRole('region', { name: '簡報者備註' }),
  ).toContainText(coverNotes);
  await expect(
    presenter.getByRole('region', { name: '簡報者備註' }).locator('p'),
  ).toHaveCSS('white-space', 'pre-wrap');
  await expect(page.getByText(coverNotes, { exact: true })).toHaveCount(0);
  await expect(page.locator('.presenter-notes')).toHaveCount(0);
  const currentPreview = presenter.getByRole('region', { name: '目前投影片' });
  const nextPreview = presenter.getByRole('region', { name: '下一個畫面' });
  await expect(currentPreview.locator('.immerslides-slide')).toHaveAttribute(
    'data-slide',
    'cover',
  );
  await expect(nextPreview.locator('.immerslides-slide')).toHaveAttribute(
    'data-slide',
    'overview',
  );
  await expect(currentPreview.locator('.immerslides-slide')).toHaveAttribute(
    'data-still',
    'true',
  );
  await expect(presenter.locator('.immerslides-presenter')).toHaveCSS(
    'display',
    'flex',
  );
  await expect(presenter.locator('.demo-inventory')).toHaveCSS(
    'display',
    'grid',
  );
  await page.keyboard.press('p');
  await page.getByRole('button', { name: '簡報者模式（P）' }).click();
  await expect.poll(() => context.pages().length).toBe(2);
  await presenter.screenshot({ path: 'artifacts/presenter-desktop.png' });
});

test('shares audience and presenter progress through same-page steps and end state', async ({
  page,
}) => {
  await page.goto('/');
  const presenter = await openPresenter(page);
  const currentPreview = presenter.getByRole('region', { name: '目前投影片' });
  const nextPreview = presenter.getByRole('region', { name: '下一個畫面' });
  await jump(page, 'code');
  await expect(
    currentPreview.locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '0');
  await expect(
    nextPreview.locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '1');
  await expect(
    presenter.getByRole('region', { name: '簡報者備註' }),
  ).toContainText('本頁依序說明輸入整理、資料驗證與送出。');
  await presenter.keyboard.press('ArrowRight');
  await expect(
    current(page).locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '1');
  await expect(
    currentPreview.locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '1');
  await expect(
    nextPreview.locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '2');
  await page.keyboard.press('ArrowRight');
  await expect(
    currentPreview.locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '2');
  await expect(nextPreview.locator('.immerslides-slide')).toHaveAttribute(
    'data-slide',
    'languages',
  );
  await presenter.getByRole('button', { name: '下一步', exact: true }).click();
  await expect(current(page)).toHaveAttribute('data-slide', 'languages');
  await presenter.getByRole('button', { name: '上一步', exact: true }).click();
  await expect(current(page)).toHaveAttribute('data-slide', 'code');
  await expect(
    current(page).locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '2');
  await jump(page, 'steps');
  await expect(currentPreview.locator('.demo-reveal')).not.toBeVisible();
  await expect(nextPreview.locator('.demo-reveal')).toBeVisible();
  await currentPreview
    .getByRole('heading', { name: '目前投影片', exact: true })
    .click();
  await presenter.keyboard.press('Space');
  await expect(current(page)).toHaveAttribute('data-slide', 'steps');
  await expect(current(page).locator('.demo-reveal')).toBeVisible();
  await presenter.keyboard.press('PageDown');
  await expect(current(page)).toHaveAttribute('data-slide', 'navigation');
  await presenter.keyboard.press('PageUp');
  await expect(current(page)).toHaveAttribute('data-slide', 'steps');
  await expect(current(page).locator('.demo-reveal')).not.toBeVisible();
  await jump(page, 'closing');
  await expect(nextPreview).toContainText('已到最後一頁');
  await expect(nextPreview.locator('.immerslides-preview')).toHaveCount(0);
  await expect(
    presenter.getByRole('button', { name: '下一步', exact: true }),
  ).toBeDisabled();
  await expect(
    presenter.getByRole('region', { name: '簡報者備註' }),
  ).toContainText('回顧需要採用的功能');
});

test('pauses and resets the clock, closes and reopens, and closes with the audience', async ({
  page,
  context,
}) => {
  await page.goto('/');
  let presenter = await openPresenter(page);
  await expect(presenter.getByRole('timer', { name: '已用時間' })).toHaveText(
    '00:00',
  );
  await presenter.getByRole('button', { name: '暫停計時' }).click();
  await expect(
    presenter.getByRole('button', { name: '繼續計時' }),
  ).toBeVisible();
  await expect(presenter.getByText('已暫停', { exact: true })).toBeVisible();
  await presenter.getByRole('button', { name: '重設計時' }).click();
  await expect(presenter.getByRole('timer', { name: '已用時間' })).toHaveText(
    '00:00',
  );
  await presenter.getByRole('button', { name: '繼續計時' }).click();
  await expect(
    presenter.getByRole('button', { name: '暫停計時' }),
  ).toBeVisible();
  await presenter.getByRole('button', { name: '關閉簡報者模式' }).click();
  await expect.poll(() => presenter.isClosed()).toBe(true);
  await expect.poll(() => context.pages().length).toBe(1);
  const reopened = page.waitForEvent('popup');
  await page.keyboard.press('p');
  presenter = await reopened;
  await expect(
    presenter.getByRole('button', { name: '暫停計時' }),
  ).toBeVisible();
  await page.reload();
  await expect.poll(() => presenter.isClosed()).toBe(true);
});

test('ignores modified, repeated, and editable-field keys and reports a blocked popup', async ({
  page,
}) => {
  await page.goto('/');
  const presenter = await openPresenter(page);
  await presenter.keyboard.press('Control+ArrowRight');
  await presenter.keyboard.press('Shift+ArrowRight');
  await expect(current(page)).toHaveAttribute('data-slide', 'cover');
  await presenter.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        repeat: true,
        bubbles: true,
      }),
    );
    const input = document.createElement('input');
    input.setAttribute('aria-label', '測試輸入');
    document.body.append(input);
    input.focus();
  });
  await presenter.keyboard.press('ArrowRight');
  await expect(current(page)).toHaveAttribute('data-slide', 'cover');
  await presenter.close();
  await page.evaluate(() => {
    window.open = () => null;
  });
  await page.keyboard.press('p');
  await expect(page.getByRole('status')).toContainText(
    '請允許此網站的彈出式視窗',
  );
});
