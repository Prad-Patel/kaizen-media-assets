// Capture deterministic frames of the Framer Motion composition.
// Env: DUR (seconds, default 22.0), OUT (frames dir, default "frames"), FPS (default 30)
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const FPS = parseInt(process.env.FPS || '30', 10);
const DUR = parseFloat(process.env.DUR || '22.0');
const OUT = path.join(__dirname, process.env.OUT || 'frames');
const ENTRY = path.join(__dirname, 'index.html');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    args: ['--force-device-scale-factor=1', '--disable-lcd-text', '--hide-scrollbars'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + ENTRY);
  await page.waitForFunction('typeof window.__seek === "function"');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const total = Math.round(FPS * DUR);
  for (let i = 0; i < total; i++) {
    await page.evaluate((tt) => window.__seek(tt), i / FPS);
    await page.waitForTimeout(8);
    // omitBackground keeps the canvas transparent so ffmpeg can composite this
    // typography layer straight over the b-roll base track.
    await page.screenshot({ path: path.join(OUT, `f${String(i).padStart(4, '0')}.png`), omitBackground: true });
    if (i % 150 === 0) console.log(`frame ${i}/${total}`);
  }
  await browser.close();
  console.log('capture done:', total, 'frames');
})().catch((e) => { console.error(e); process.exit(1); });
