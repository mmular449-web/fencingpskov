// Local laboratory diagnostic; not a physical-device frame-rate guarantee.
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const results = [];
try {
  for (const fallback of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    if (fallback) await context.addInitScript(() => {
      Object.defineProperty(window, 'ScrollTimeline', { value: undefined, configurable: true });
      Object.defineProperty(window, 'ViewTimeline', { value: undefined, configurable: true });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4174/fencingpskov/');
    await page.locator('.hero-photo').evaluate(img => img.decode());
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    const sample = await page.evaluate(async () => {
      const intervals = [], longTasks = [];
      const observer = new PerformanceObserver(list => longTasks.push(...list.getEntries().map(entry => entry.duration)));
      observer.observe({ type: 'longtask' });
      const end = document.querySelector('.duel-scene').getBoundingClientRect().bottom + scrollY - innerHeight;
      await new Promise(resolve => {
        let start, last;
        const frame = now => {
          start ??= now; last ??= now;
          intervals.push(now - last); last = now;
          const progress = Math.min(1, (now - start) / 6000);
          scrollTo({ top: end * progress, behavior: 'instant' });
          if (progress < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
      observer.disconnect();
      intervals.shift(); intervals.sort((a, b) => a - b);
      return {
        frames: intervals.length,
        medianFrameMs: intervals[Math.floor(intervals.length * .5)],
        p95FrameMs: intervals[Math.floor(intervals.length * .95)],
        longTasksMs: longTasks,
        overflow: document.documentElement.scrollWidth > innerWidth,
        nativeTimelines: typeof window.ScrollTimeline === 'function'
          ? document.getAnimations().filter(animation => animation.timeline instanceof window.ScrollTimeline).length : 0,
      };
    });
    results.push({ mode: fallback ? 'JS scroll fallback' : 'native timeline', viewport: '390x844', cpuSlowdown: 4, ...sample, errors });
    await context.close();
  }
  const report = { checkedAt: new Date().toISOString(), note: 'Local Chromium emulation with 4x CPU slowdown. Frame samples are diagnostics, not physical iPhone/Safari results.', results };
  await writeFile('docs/qa/motion-runtime.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
