#!/usr/bin/env bash
# Render one branded still card (WordPress featured image / Google Business / X).
#
#   ./render_image.sh image_config.json out.jpg [width] [height]
#
# Defaults to 1200x630. Use 1080x1080 for a square X card.
set -euo pipefail
cd "$(dirname "$0")"

CONFIG="${1:?usage: render_image.sh <config.json> <out.jpg> [width] [height]}"
OUT="${2:?usage: render_image.sh <config.json> <out.jpg> [width] [height]}"
W="${3:-1200}"
H="${4:-630}"

[ -d node_modules ] || npm install --no-audit --no-fund

./node_modules/.bin/esbuild ./src/app_image.jsx --bundle --outfile=dist/bundle_img.js \
  --loader:.jsx=jsx --define:process.env.NODE_ENV='"production"' >/dev/null

python3 - "$CONFIG" "$W" "$H" <<'PY'
import json, sys, pathlib
cfg = json.load(open(sys.argv[1]))
cfg["width"], cfg["height"] = int(sys.argv[2]), int(sys.argv[3])
tpl = pathlib.Path("index.template.html").read_text()
html = (tpl.replace("/*__CONFIG__*/", json.dumps(cfg, ensure_ascii=False))
           .replace("dist/bundle.js", "dist/bundle_img.js")
           .replace("width: 1080px; height: 1920px", f"width: {cfg['width']}px; height: {cfg['height']}px"))
pathlib.Path("image.html").write_text(html)
PY

W="$W" H="$H" OUTFILE="$OUT" node - <<'JS'
const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const w = parseInt(process.env.W, 10), h = parseInt(process.env.H, 10);
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    args: ['--force-device-scale-factor=1', '--disable-lcd-text', '--hide-scrollbars'],
  });
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('file://' + path.join(process.cwd(), 'image.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/_kaizen_card.png' });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
JS

ffmpeg -y -loglevel error -i /tmp/_kaizen_card.png -q:v 3 "$OUT"
rm -f /tmp/_kaizen_card.png image.html
echo "==> done: $OUT"
