import { expect, test } from '@playwright/test';

const current = (page: import('@playwright/test').Page) =>
  page.locator('.page-incoming > .stage-viewport > .immerslides-slide');

async function settle(page: import('@playwright/test').Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (animation) =>
                animation.playState === 'running' &&
                animation.effect?.getTiming().iterations !== Infinity,
            ).length,
      ),
    )
    .toBe(0);
}

async function jump(page: import('@playwright/test').Page, id: string) {
  await page.keyboard.press('o');
  await page.locator(`.slide-list [data-target="${id}"]`).click();
  await expect(current(page)).toHaveAttribute('data-slide', id);
  await expect(page.locator('.page-outgoing')).toHaveCount(0);
  await expect(current(page).locator(':scope > .immerslides-body')).toHaveCSS(
    'opacity',
    '1',
  );
  await settle(page);
}

test('advances whole pages, restores progress, and supports the feature tour', async ({
  page,
}) => {
  await page.goto('/');
  await expect(current(page)).toHaveAttribute('data-slide', 'cover');
  await page.keyboard.press('ArrowRight');
  await expect(current(page)).toHaveAttribute('data-slide', 'overview');
  await expect(
    current(page).getByRole('button', { name: /CodeBlock/ }),
  ).toBeVisible();
  await expect(
    current(page).getByRole('button', { name: /getSlideHref/ }),
  ).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(current(page)).toHaveAttribute('data-slide', 'layouts');
  await page.reload();
  await expect(current(page)).toHaveAttribute('data-slide', 'layouts');
  await page.keyboard.press('ArrowLeft');
  await expect(current(page)).toHaveAttribute('data-slide', 'overview');
  await jump(page, 'code');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: 'artifacts/workflow-desktop.png' });
  await jump(page, 'previews');
  await expect(
    current(page).locator('.immerslides-preview .immerslides-slide'),
  ).toBeVisible();
  await expect(
    current(page).locator('.immerslides-preview .immerslides-rail'),
  ).toBeVisible();
  await jump(page, 'steps');
  await expect(current(page).locator('.demo-reveal')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(current(page)).toHaveAttribute('data-slide', 'steps');
  await expect(current(page).locator('.demo-reveal')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(current(page)).toHaveAttribute('data-slide', 'navigation');
  await jump(page, 'extensions');
  await page.getByRole('button', { name: '標記本頁重點' }).click();
  await expect(
    page.getByRole('button', { name: '標記本頁重點' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.demo-reserved-note')).toBeVisible();
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: '放映操作' })).toContainText(
    '示範 Provider',
  );
  await expect(
    page.getByRole('link', { name: '功能速查講義' }),
  ).toHaveAttribute('href', './handout.html');
  await page.keyboard.press('Escape');
  await page.screenshot({ path: 'artifacts/extensions-desktop.png' });
});

test('keeps the chapter rail mounted and smoothly retargets chapter movement', async ({
  page,
}) => {
  await page.goto('/');
  await jump(page, 'previews');
  const track = page.locator('.immerslides-guide-overlay .immerslides-rail ol');
  const identity = await track.evaluate((element) => {
    element.setAttribute('data-persistent-check', 'same');
    return element.getAttribute('data-persistent-check');
  });
  const start = await track.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await page.keyboard.press('ArrowRight');
  await expect(current(page)).toHaveAttribute('data-slide', 'steps');
  await page.waitForTimeout(100);
  const middle = await track.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  expect(middle).not.toBe(start);
  expect(middle).not.toBe('matrix(1, 0, 0, 1, 0, 0)');
  await expect
    .poll(() =>
      track.evaluate((element) => getComputedStyle(element).transform),
    )
    .toBe('matrix(1, 0, 0, 1, 0, 0)');
  await expect(track).toHaveAttribute('data-persistent-check', identity!);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowRight');
  await expect(current(page)).toHaveAttribute('data-slide', 'steps');
  await expect
    .poll(() =>
      track.evaluate((element) => getComputedStyle(element).transform),
    )
    .toBe('matrix(1, 0, 0, 1, 0, 0)');
  await page
    .locator('.immerslides-guide-overlay')
    .getByRole('button', { name: '03 擴充與重用' })
    .click();
  await expect(current(page)).toHaveAttribute('data-slide', 'extensions');
  await expect(page.locator('.page-outgoing')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (animation) =>
                animation.playState === 'running' &&
                animation.effect?.getTiming().iterations !== Infinity,
            ).length,
      ),
    )
    .toBe(0);
  await page.screenshot({ path: 'artifacts/guide-desktop.png' });
});

test('never paints the outgoing page again after its transition ends', async ({
  page,
}) => {
  await page.goto('/');
  await jump(page, 'composition');
  await page.evaluate(() => {
    const store = window as unknown as { staleFrames: string[] };
    store.staleFrames = [];
    const sample = () => {
      const outgoing = document.querySelector<HTMLElement>('.page-outgoing');
      const slide = outgoing?.querySelector<HTMLElement>('.immerslides-slide');
      if (
        outgoing &&
        slide &&
        !outgoing.getAnimations().length &&
        slide.checkVisibility({
          opacityProperty: true,
          visibilityProperty: true,
        })
      )
        store.staleFrames.push(slide.dataset.slide!);
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  for (const [key, id] of [
    ['PageDown', 'previews'],
    ['PageUp', 'composition'],
    ['PageDown', 'previews'],
    ['PageUp', 'composition'],
  ]) {
    await page.keyboard.press(key);
    await expect(current(page)).toHaveAttribute('data-slide', id);
    await expect(page.locator('.page-outgoing')).toHaveCount(0);
  }
  expect(
    await page.evaluate(
      () => (window as unknown as { staleFrames: string[] }).staleFrames,
    ),
  ).toEqual([]);
});

test('uses reduced motion and keeps the fixed stage in a narrow viewport', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.keyboard.press('ArrowRight');
  await expect(current(page)).toHaveAttribute('data-slide', 'overview');
  await expect(current(page)).toHaveAttribute('data-still', 'true');
  await expect(
    page.locator('.immerslides-guide-overlay .immerslides-rail ol'),
  ).toHaveCSS('transition-duration', '0s');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({ path: 'artifacts/goals-mobile.png' });
});

test('keeps every feature page above the footer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('o');
  const ids = await page
    .locator('.slide-list [data-target]')
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-target')!),
    );
  await page.keyboard.press('Escape');
  expect(ids.length).toBeGreaterThan(0);
  for (const id of ids) {
    await jump(page, id);
    const fits = await current(page).evaluate((element) => {
      const body = element
        .querySelector(':scope > .immerslides-body')!
        .getBoundingClientRect();
      const footer = element
        .querySelector(':scope > .immerslides-footer')!
        .getBoundingClientRect();
      return {
        aboveFooter: body.bottom <= footer.top - 10,
        codeFits: Array.from(element.querySelectorAll('pre')).every(
          (pre) => pre.scrollWidth <= pre.clientWidth + 1,
        ),
      };
    });
    await page.screenshot({ path: `artifacts/tour-${id}.png` });
    expect(fits.aboveFooter, `${id} content fits above its footer`).toBe(true);
    expect(fits.codeFits, `${id} code fits without horizontal scrolling`).toBe(
      true,
    );
  }
});

test('walks code sections without changing the source and reverses rapidly', async ({
  page,
}) => {
  await page.goto('/');
  await jump(page, 'code');
  const walkthrough = current(page).locator('.immerslides-code-walkthrough');
  const code = walkthrough.locator('code');
  const source = await code.textContent();
  expect(source).toContain('\n\n');
  await expect(walkthrough).toHaveAttribute('data-step', '0');
  await expect(code.locator('[data-focused="true"]')).toHaveCount(4);
  await expect(code.locator('[data-line="6"] .hljs-comment')).toBeVisible();
  await expect(code.locator('[data-line="7"] .hljs-comment')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(walkthrough).toHaveAttribute('data-step', '1');
  await expect(
    walkthrough.locator('.immerslides-step-explanation'),
  ).toContainText('在邊界檢查資料。');
  await expect(code.locator('[data-focused="true"]')).toHaveCount(5);
  await page.keyboard.press('ArrowRight');
  await expect(walkthrough).toHaveAttribute('data-step', '2');
  await expect
    .poll(() =>
      walkthrough.locator('pre').evaluate((element) => element.scrollTop),
    )
    .toBeGreaterThan(0);
  expect(await code.textContent()).toBe(source);
  await settle(page);
  await page.screenshot({ path: 'artifacts/code-focus-desktop.png' });
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await expect(walkthrough).toHaveAttribute('data-step', '1');
  await expect(code.locator('[data-focused="true"]').first()).toHaveAttribute(
    'data-line',
    '6',
  );
  expect(await code.textContent()).toBe(source);
  await page.reload();
  await expect(walkthrough).toHaveAttribute('data-step', '1');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(current(page)).toHaveAttribute('data-slide', 'languages');
  for (const language of [
    'ts',
    'py',
    'java',
    'sql',
    'json',
    'yml',
    'sh',
    'html',
    'css',
  ])
    await expect(
      current(page)
        .locator(`[data-language="${language}"] [class*="hljs-"]`)
        .first(),
    ).toBeVisible();
});

test('walks flows and freely composed parts using the same player step', async ({
  page,
}) => {
  await page.goto('/');
  await jump(page, 'timeline');
  const flow = current(page).locator('.immerslides-flow-walkthrough');
  for (const [index, id] of ['input', 'validate', 'submit'].entries()) {
    if (index) await page.keyboard.press('ArrowRight');
    await expect(flow).toHaveAttribute('data-step', String(index));
    await expect(
      flow.locator(`[data-node="${id}"] .immerslides-flow-node`),
    ).toHaveAttribute('data-status', 'active');
    await expect(
      flow.locator('.immerslides-flow-node[data-status="active"]'),
    ).toHaveCount(1);
    await expect(
      flow.locator('.immerslides-flow-connector[data-status="active"]').first(),
    ).toBeVisible();
  }
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await expect(
    flow.locator('[data-node="validate"] .immerslides-flow-node'),
  ).toHaveAttribute('data-status', 'active');
  await settle(page);
  await page.screenshot({ path: 'artifacts/flow-focus-desktop.png' });
  await jump(page, 'composition');
  const composition = current(page).locator('.demo-composition');
  await expect(composition).toHaveAttribute('data-step', '0');
  await page.keyboard.press('ArrowRight');
  await expect(composition).toHaveAttribute('data-step', '1');
  await expect(
    composition.locator('.immerslides-flow-node[data-status="complete"]'),
  ).toHaveCount(1);
  await expect(
    composition.locator('.immerslides-flow-node[data-status="active"]'),
  ).toHaveText('檢查條件先確認再送出');
  await expect(
    composition.locator('code [data-focused="true"]').first(),
  ).toHaveAttribute('data-line', '6');
  await settle(page);
  await page.screenshot({ path: 'artifacts/composition-desktop.png' });
});

test('keeps walkthrough previews still and honors reduced motion for composed parts', async ({
  page,
}) => {
  await page.goto('/');
  await jump(page, 'previews');
  const preview = current(page).locator('.immerslides-preview');
  await expect(
    preview.locator('.immerslides-code-walkthrough'),
  ).toHaveAttribute('data-step', '1');
  await expect(preview.locator('.immerslides-code-focus')).toHaveCSS(
    'transition-duration',
    '0s',
  );
  await expect(preview.locator('.immerslides-step-copy')).toHaveCSS(
    'animation-name',
    'none',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await jump(page, 'composition');
  await page.keyboard.press('ArrowRight');
  await expect(current(page).locator('.immerslides-code-focus')).toHaveCSS(
    'transition-duration',
    '0s',
  );
  await expect(
    current(page).locator('.immerslides-flow-node').first(),
  ).toHaveCSS('transition-duration', '0s');
  await expect(current(page).locator('.immerslides-step-copy')).toHaveCSS(
    'animation-name',
    'none',
  );
});
