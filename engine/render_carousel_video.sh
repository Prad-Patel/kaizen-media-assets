#!/usr/bin/env bash
# Render the same carousel content as an animated MP4, for feeds where a PDF
# cannot go (Instagram, TikTok) or where autoplay beats a swipe.
#
#   ./render_carousel_video.sh carousel.json out.mp4 [width] [height]
#
# Each slide fades in, its icon scales up and the text blocks stagger in, then
# it crossfades to the next. Duration comes from the slide count, roughly 3.2s
# for the cover, 4.2s per item and 4.4s for the closing slide.
#
# Layout, icons and branding come from carousel_html.py, shared with
# render_carousel.sh. Frames are seeked deterministically through
# window.__seek(t), the same contract capture.js uses, so a rerun of the same
# config produces an identical file.
#
# Defaults to 1080x1350 (4:5). Pass 1080 1920 for a 9:16 cut.
set -euo pipefail
cd "$(dirname "$0")"

CONFIG="${1:?usage: render_carousel_video.sh <carousel.json> <out.mp4> [width] [height]}"
OUT="${2:?usage: render_carousel_video.sh <carousel.json> <out.mp4> [width] [height]}"
W="${3:-1080}"
H="${4:-1350}"
FPS="${FPS:-30}"

[ -d node_modules ] || npm install --silent

python3 - "$CONFIG" "$W" "$H" <<'PY'
import json, pathlib, sys
sys.path.insert(0, ".")
from carousel_html import build

cfg = json.load(open(sys.argv[1]))
pathlib.Path("carousel_anim.html").write_text(
    build(cfg, int(sys.argv[2]), int(sys.argv[3]), animated=True))
PY

FRAMES="$(mktemp -d)"
trap 'rm -rf "$FRAMES" carousel_anim.html' EXIT

W="$W" H="$H" FPS="$FPS" FRAMES="$FRAMES" node - <<'JS'
const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const w = parseInt(process.env.W, 10), h = parseInt(process.env.H, 10);
  const fps = parseInt(process.env.FPS, 10);
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    args: ['--force-device-scale-factor=1', '--disable-lcd-text', '--hide-scrollbars'],
  });
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('file://' + path.join(process.cwd(), 'carousel_anim.html'));
  await page.waitForFunction('typeof window.__seek === "function"');
  await page.evaluate(() => document.fonts.ready);
  // Fit every slide once up front so the scale is identical on every frame.
  // __seek only writes transforms on [data-a] children and .icon, never on
  // .fit itself, so this survives the whole capture.
  const fits = await page.evaluate(() => window.__autofit(1.45));
  fits.filter(f => f.scale !== 1).forEach(f => console.log(`==> slide ${f.slide} fit to ${f.scale}`));
  await page.waitForTimeout(300);
  const dur = await page.evaluate(() => window.__duration);
  const total = Math.round(dur * fps);
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.__seek(t), i / fps);
    await page.waitForTimeout(6);
    await page.screenshot({ path: path.join(process.env.FRAMES, `f${String(i).padStart(5, '0')}.png`) });
    if (i % 60 === 0) console.log(`frame ${i}/${total}`);
  }
  await browser.close();
  console.log(`capture done: ${total} frames, ${dur.toFixed(1)}s`);
})().catch((e) => { console.error(e); process.exit(1); });
JS

# Silent AAC track: feeds autoplay muted and some uploaders reject audioless MP4.
ffmpeg -y -loglevel error -framerate "$FPS" -i "$FRAMES/f%05d.png" \
  -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium \
  -c:a aac -b:a 96k -shortest -movflags +faststart "$OUT"

echo "==> done: $OUT ($W x $H, ${FPS}fps)"
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT"
