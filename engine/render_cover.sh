#!/usr/bin/env bash
# Composite real typography over a generated cover illustration.
#
#   ./render_cover.sh cover_config.json out.jpg [width] [height]
#
# cover_config.json:
#   {
#     "image":    "path/to/illustration.jpg",   // the Gemini image, no text in it
#     "kicker":   "Zapier vs Make vs n8n in 2026",
#     "headline": ["Three platforms.", "One right fit."],
#     "footer":   true                           // navy footer bar (Instagram cover)
#   }
#
# The illustration is drawn full-bleed (object-fit: cover), the type is set in
# Space Grotesk / Inter with shadows hugging the glyphs only, never a scrim.
# Defaults to 1200x800 (3:2 blog cover). Use 1080x1350 for the 4:5 Instagram
# cover.
set -euo pipefail
cd "$(dirname "$0")"

CONFIG="${1:?usage: render_cover.sh <cover_config.json> <out.jpg> [width] [height]}"
OUT="${2:?usage: render_cover.sh <cover_config.json> <out.jpg> [width] [height]}"
W="${3:-1200}"
H="${4:-800}"

python3 - "$CONFIG" "$W" "$H" <<'PY'
import base64, json, mimetypes, pathlib, sys

cfg = json.load(open(sys.argv[1]))
w, h = int(sys.argv[2]), int(sys.argv[3])

img_path = pathlib.Path(cfg["image"])
mime = mimetypes.guess_type(str(img_path))[0] or "image/jpeg"
img_data = "data:%s;base64,%s" % (mime, base64.b64encode(img_path.read_bytes()).decode())

logo = pathlib.Path("brand/logo_small.png")
logo_data = "data:image/png;base64,%s" % base64.b64encode(logo.read_bytes()).decode()

def font_face(fam, weight, path):
    data = base64.b64encode(pathlib.Path(path).read_bytes()).decode()
    return ("@font-face{font-family:'%s';font-weight:%d;font-style:normal;"
            "src:url(data:font/woff2;base64,%s) format('woff2');}" % (fam, weight, data))

fonts = "".join([
    font_face("Space Grotesk", 700, "fonts/space-grotesk-latin-700-normal.woff2"),
    font_face("Space Grotesk", 500, "fonts/space-grotesk-latin-500-normal.woff2"),
    font_face("Inter", 600, "fonts/inter-latin-600-normal.woff2"),
    font_face("Inter", 400, "fonts/inter-latin-400-normal.woff2"),
])

kicker = cfg.get("kicker", "")
lines = cfg.get("headline", [])
footer = bool(cfg.get("footer", False))

scale = w / 1200.0
kicker_size = round(30 * scale)
head_size = round(78 * scale) if w >= h else round(88 * scale)
pad = round(64 * scale)
logo_w = round(96 * scale)
footer_h = round(96 * scale) if footer else 0
halo = "0 1px 0 rgba(234,240,249,.95), 0 0 10px rgba(234,240,249,.9), 0 0 26px rgba(234,240,249,.8), 0 0 54px rgba(234,240,249,.6)"

head_html = ""
for i, line in enumerate(lines):
    colour = "#0A1628" if i == 0 else "#2E7CF6"
    head_html += '<div style="color:%s">%s</div>' % (colour, line)

footer_html = ""
if footer:
    footer_html = ('<div style="position:absolute;left:0;right:0;bottom:0;height:%dpx;'
                   'background:#0A1628;display:flex;align-items:center;justify-content:space-between;'
                   'padding:0 %dpx;">'
                   '<img src="%s" style="height:%dpx">'
                   '<div style="font-family:\'Inter\',sans-serif;font-weight:400;font-size:%dpx;'
                   'color:#9FB6DC;letter-spacing:.04em">kaizenaiconsulting.com</div></div>'
                   % (footer_h, pad, logo_data, round(footer_h * 0.42), round(26 * scale)))

logo_html = ""
if not footer:
    logo_html = ('<img src="%s" style="position:absolute;top:%dpx;right:%dpx;width:%dpx;'
                 'filter:drop-shadow(0 2px 10px rgba(234,240,249,.9))">' % (logo_data, pad, pad, logo_w))

html = """<!doctype html><html><head><meta charset="utf-8"><style>
%s
html,body{margin:0;padding:0}
#stage{position:relative;width:%dpx;height:%dpx;overflow:hidden;background:#EAF0F9}
#bg{position:absolute;inset:0;width:100%%;height:100%%;object-fit:cover}
#copy{position:absolute;top:%dpx;left:%dpx;right:%dpx}
#kicker{font-family:'Inter',sans-serif;font-weight:600;font-size:%dpx;letter-spacing:.14em;
  text-transform:uppercase;color:#0FA47E;text-shadow:%s;margin-bottom:%dpx}
#head{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:%dpx;line-height:1.04;
  letter-spacing:-0.01em;text-shadow:%s}
</style></head><body>
<div id="stage">
  <img id="bg" src="%s">
  <div id="copy"><div id="kicker">%s</div><div id="head">%s</div></div>
  %s%s
</div></body></html>""" % (
    fonts, w, h, pad, pad, pad, kicker_size, halo, round(18 * scale),
    head_size, halo, img_data, kicker, head_html, logo_html, footer_html)

pathlib.Path("cover.html").write_text(html)
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
  await page.goto('file://' + path.join(process.cwd(), 'cover.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/_kaizen_cover.png' });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
JS

ffmpeg -y -loglevel error -i /tmp/_kaizen_cover.png -q:v 3 "$OUT"
rm -f /tmp/_kaizen_cover.png cover.html
echo "==> done: $OUT ($W x $H)"
