// Renders every mockup to design/screenshots/*.png
// Usage: node design/screenshot.mjs   (requires the playwright package + Chromium)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(root, 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const shots = [
  { file: 'web/landing.html', out: 'web-landing.png', width: 1600, height: 1000, fullPage: true },
  { file: 'web/login.html', out: 'web-login.png', width: 1600, height: 1000, fullPage: false },
  {
    file: 'web/dashboard.html',
    out: 'web-dashboard.png',
    width: 1600,
    height: 1000,
    fullPage: true,
  },
  {
    file: 'web/moderation.html',
    out: 'web-moderation.png',
    width: 1600,
    height: 1000,
    fullPage: true,
  },
  {
    file: 'web/ai-providers.html',
    out: 'web-ai-providers.png',
    width: 1600,
    height: 1000,
    fullPage: true,
  },
  { file: 'web/settings.html', out: 'web-settings.png', width: 1600, height: 1000, fullPage: true },
  {
    file: 'web/dashboard-assistant.html',
    out: 'web-assistant.png',
    width: 1600,
    height: 1000,
    fullPage: false,
  },
  {
    file: 'desktop/assistant.html',
    out: 'desktop-assistant.png',
    width: 1440,
    height: 900,
    fullPage: true,
  },
  {
    file: 'desktop/onboarding.html',
    out: 'desktop-onboarding.png',
    width: 1440,
    height: 900,
    fullPage: true,
  },
  { file: 'desktop/main.html', out: 'desktop-main.png', width: 1440, height: 900, fullPage: true },
  { file: 'desktop/logs.html', out: 'desktop-logs.png', width: 1440, height: 900, fullPage: true },
  {
    file: 'desktop/settings.html',
    out: 'desktop-settings.png',
    width: 1440,
    height: 900,
    fullPage: true,
  },
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.width, height: s.height } });
  await page.goto('file://' + path.join(root, 'mockups', s.file));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outDir, s.out), fullPage: s.fullPage });
  console.log('rendered', s.out);
  await page.close();
}
await browser.close();
console.log('done →', outDir);
