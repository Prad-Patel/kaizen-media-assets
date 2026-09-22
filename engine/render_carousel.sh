#!/usr/bin/env bash
# Render a multi-page PDF carousel for a LinkedIn document post.
#
#   ./render_carousel.sh carousel.json out.pdf [width] [height]
#
# Layout, icons and branding live in carousel_html.py, shared with
# render_carousel_video.sh so the static and animated cuts cannot drift.
#
# Defaults to 1080x1350 (4:5). LinkedIn renders a document post at the PDF's
# own aspect ratio, and 4:5 takes the most feed height on mobile.
#
# Serve the result from jsDelivr, not raw.githubusercontent: raw returns
# application/octet-stream and LinkedIn will not read it as a document.
set -euo pipefail
cd "$(dirname "$0")"

CONFIG="${1:?usage: render_carousel.sh <carousel.json> <out.pdf> [width] [height]}"
OUT="${2:?usage: render_carousel.sh <carousel.json> <out.pdf> [width] [height]}"
W="${3:-1080}"
H="${4:-1350}"

python3 - "$CONFIG" "$W" "$H" <<'PY'
import json, pathlib, sys
sys.path.insert(0, ".")
from carousel_html import build

cfg = json.load(open(sys.argv[1]))
pathlib.Path("carousel.html").write_text(
    build(cfg, int(sys.argv[2]), int(sys.argv[3]), animated=False))
PY

W="$W" H="$H" OUT="$OUT" node - <<'JS'
const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const w = parseInt(process.env.W, 10), h = parseInt(process.env.H, 10);
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    args: ['--force-device-scale-factor=1', '--disable-lcd-text', '--hide-scrollbars'],
  });
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('file://' + path.join(process.cwd(), 'carousel.html'));
  await page.evaluate(() => document.fonts.ready);
  const fits = await page.evaluate(() => window.__autofit(1.45));
  fits.filter(f => f.scale !== 1).forEach(f => console.log(`==> slide ${f.slide} fit to ${f.scale}`));
  await page.waitForTimeout(200);
  await page.pdf({ path: process.env.OUT, width: `${w}px`, height: `${h}px`,
                   printBackground: true });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
JS

rm -f carousel.html
echo "==> done: $OUT ($W x $H)"
