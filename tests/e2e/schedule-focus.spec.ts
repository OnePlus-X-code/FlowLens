import { expect, test } from '@playwright/test';

test('desktop schedule stays single-column in time order and focus completes a task', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();

  const note = [
    '上午',
    '- 读论文',
    '下午',
    '- 撰写周报',
    '- code review',
    '晚上',
    '- 打球',
    '- 写代码',
  ].join('\n');

  await page.getByPlaceholder('标题（例如：周会前的思考）').fill('');
  await page.getByPlaceholder(/示例：/).fill(note);
  await page.getByText('生成任务块', { exact: true }).click();

  const taskTitles = page.locator('text=/^(读论文|撰写周报|code review|打球|写代码)$/');
  await expect(taskTitles).toHaveCount(5);

  const ordered = await taskTitles.evaluateAll((nodes) =>
    nodes.map((node) => ({
      text: node.textContent?.trim(),
      top: node.getBoundingClientRect().top,
      left: node.getBoundingClientRect().left,
    })),
  );

  expect(ordered.map((item) => item.text)).toEqual([
    '读论文',
    '撰写周报',
    'code review',
    '打球',
    '写代码',
  ]);

  for (let i = 1; i < ordered.length; i += 1) {
    expect(ordered[i].top).toBeGreaterThan(ordered[i - 1].top);
  }

  const eveningTasks = ordered.filter((item) => item.text === '打球' || item.text === '写代码');
  expect(Math.abs(eveningTasks[0].left - eveningTasks[1].left)).toBeLessThan(4);

  await page.getByText('撰写周报', { exact: true }).click();
  await expect(page.getByText('正在专注')).toBeVisible();
  await expect(page.getByText('撰写周报', { exact: true })).toBeVisible();
  await page.getByText('完成任务', { exact: true }).click();

  await expect(page.getByText('今日看板').first()).toBeVisible();
  await expect(page.getByText('1 / 5').first()).toBeVisible();
});
