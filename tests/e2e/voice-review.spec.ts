import { expect, test } from '@playwright/test';

test('review page records audio and displays a mocked transcription', async ({ page }) => {
  await page.addInitScript(() => {
    class MockMediaRecorder extends EventTarget {
      static isTypeSupported() {
        return true;
      }

      stream: MediaStream;
      state = 'inactive';
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onstop: (() => void) | null = null;

      constructor(stream: MediaStream) {
        super();
        this.stream = stream;
      }

      start() {
        this.state = 'recording';
      }

      stop() {
        this.state = 'inactive';
        const event = new BlobEvent('dataavailable', {
          data: new Blob(['mock audio'], { type: 'audio/webm' }),
        });
        this.ondataavailable?.(event);
        this.onstop?.();
      }
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () =>
          ({
            getTracks: () => [{ stop: () => undefined }],
          }) as unknown as MediaStream,
      },
    });
    window.MediaRecorder = MockMediaRecorder as unknown as typeof MediaRecorder;
  });

  await page.route('https://api.openai.com/v1/audio/transcriptions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ text: '今天我完成了周报，也发现下午更适合深度工作。' }),
    });
  });
  await page.route('https://api.openai.com/v1/responses', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        output_text: JSON.stringify({
          achievements: ['完成了周报'],
          issues: ['需要更好安排下午的深度工作'],
          moodLabel: '平静',
          moodScore: 8,
        }),
      }),
    });
  });

  await page.goto('/review');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page.getByText('开始录音', { exact: true }).click();
  await expect(page.getByText('录音中')).toBeVisible();
  await page.getByText('停止并转写', { exact: true }).click();

  await expect(page.getByText('转录结果')).toBeVisible();
  await expect(page.getByText('今天我完成了周报，也发现下午更适合深度工作。')).toBeVisible();

  await page.getByText('生成复盘', { exact: true }).click();
  await expect(page.getByText('结构化复盘', { exact: true })).toBeVisible();
  await expect(page.getByText('完成了周报', { exact: true })).toHaveCount(2);
  await expect(page.getByText('需要更好安排下午的深度工作', { exact: true })).toBeVisible();
  await expect(page.getByText('平静 · 8/10', { exact: true })).toBeVisible();
  await expect(page.getByText('周报', { exact: true })).toBeVisible();
  await expect(page.getByText('本周复盘', { exact: true })).toBeVisible();
  await expect(page.getByText('平均情绪', { exact: true })).toBeVisible();
  await expect(page.getByText('情绪趋势', { exact: true })).toBeVisible();
  await expect(page.getByText('本周摘要', { exact: true })).toBeVisible();
});
