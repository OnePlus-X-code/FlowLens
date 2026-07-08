import { expect, test } from '@playwright/test';

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

test('mobile schedule renders as a vertical list without horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();

  await page.getByPlaceholder(/示例：/).fill(
    ['上午', '- 读论文', '下午', '- 撰写周报', '晚上', '- 写代码'].join('\n'),
  );
  await page.getByText('生成任务块', { exact: true }).click();

  await expect(page.getByText('今日任务块', { exact: true })).toBeVisible();
  await expect(page.getByText('读论文', { exact: true })).toBeVisible();
  await expect(page.getByText('撰写周报', { exact: true })).toBeVisible();
  await expect(page.getByText('写代码', { exact: true })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 1;
  });
  expect(hasHorizontalOverflow).toBe(false);
});
