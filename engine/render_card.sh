#!/usr/bin/env bash
# Render one still card in the animated-infographic house style.
#
#   ./render_card.sh card_config.json out.jpg [width] [height]
#
# Same flat-vector drawing as the daily video, frozen: light paper, navy ink,
# electric blue and teal, real typography, no shadows. Defaults to 1080x1350
# (4:5), the ratio the social feeds want. Use 1080x1920 for a 9:16 story card
# and 1200x630 for a landscape WordPress featured image.
#
# render_image.sh is the older dark-gradient card and is kept for reference.
set -euo pipefail
cd "$(dirname "$0")"

CONFIG="${1:?usage: render_card.sh <config.json> <out.jpg> [width] [height]}"
OUT="${2:?usage: render_card.sh <config.json> <out.jpg> [width] [height]}"
W="${3:-1080}"
H="${4:-1350}"

[ -d node_modules ] || npm install --no-audit --no-fund

./node_modules/.bin/esbuild ./src/app_card.jsx --bundle --outfile=dist/bundle_card.js \
  --loader:.jsx=jsx --define:process.env.NODE_ENV='"production"' >/dev/null

python3 - "$CONFIG" "$W" "$H" <<'PY'
import json, sys, pathlib
cfg = json.load(open(sys.argv[1]))
cfg["width"], cfg["height"] = int(sys.argv[2]), int(sys.argv[3])
tpl = pathlib.Path("index.template.html").read_text()
html = (tpl.replace("/*__CONFIG__*/", json.dumps(cfg, ensure_ascii=False))
           .replace("dist/bundle.js", "dist/bundle_card.js")
           .replace("width: 1080px; height: 1920px", f"width: {cfg['width']}px; height: {cfg['height']}px"))
pathlib.Path("card.html").write_text(html)
PY

W="$W" H="$H" node - <<'JS'
const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const w = parseInt(process.env.W, 10), h = parseInt(process.env.H, 10);
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    args: ['--force-device-scale-factor=1', '--disable-lcd-text', '--hide-scrollbars'],
  });
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('file://' + path.join(process.cwd(), 'card.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/_kaizen_card.png' });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
JS

ffmpeg -y -loglevel error -i /tmp/_kaizen_card.png -q:v 3 "$OUT"
rm -f /tmp/_kaizen_card.png card.html
echo "==> done: $OUT ($W x $H)"
