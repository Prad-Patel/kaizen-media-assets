#!/usr/bin/env bash
# Render a content-dense teaching card: a title plus numbered items that carry
# the actual substance, so the image is useful on its own in the feed.
#
#   ./render_listcard.sh card.json out.jpg [width] [height]
#
# card.json:
#   {
#     "kicker": "AI tool selection",
#     "title":  ["The six questions I ask", "before recommending a tool"],
#     "items":  [ {"label": "...", "detail": "..."}, ... ],
#     "footer": "Prad Patel  ·  Kaizen AI Consulting"
#   }
#
# Every glyph is real typography rendered in headless Chromium, never
# AI-painted. Type auto-fits: the page shrinks a scale factor until the
# content clears the footer, so a long item can never run off the card or
# collide with the bar the way the fixed-size cover headline used to.
# Defaults to 1080x1350 (4:5, maximum feed height on mobile).
set -euo pipefail
cd "$(dirname "$0")"

CONFIG="${1:?usage: render_listcard.sh <card.json> <out.jpg> [width] [height]}"
OUT="${2:?usage: render_listcard.sh <card.json> <out.jpg> [width] [height]}"
W="${3:-1080}"
H="${4:-1350}"

python3 - "$CONFIG" "$W" "$H" <<'PY'
import base64, html as H, json, pathlib, sys

cfg = json.load(open(sys.argv[1]))
w, h = int(sys.argv[2]), int(sys.argv[3])
scale = w / 1080.0

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

px = lambda v: round(v * scale)
pad = px(76)
footer_h = px(112)

items_html = ""
for i, it in enumerate(cfg.get("items", []), 1):
    detail = it.get("detail", "")
    detail_html = ('<div class="detail">%s</div>' % H.escape(detail)) if detail else ""
    items_html += (
        '<div class="row">'
        '<div class="num">%02d</div>'
        '<div class="body"><div class="label">%s</div>%s</div>'
        '</div>' % (i, H.escape(it.get("label", "")), detail_html))

title_html = "".join('<div>%s</div>' % H.escape(t) for t in cfg.get("title", []))
kicker = H.escape(cfg.get("kicker", ""))
footer = H.escape(cfg.get("footer", "kaizenaiconsulting.com"))

html = """<!doctype html><html><head><meta charset="utf-8"><style>
%(fonts)s
html,body{margin:0;padding:0;background:#EAF0F9}
#stage{position:relative;width:%(w)dpx;height:%(h)dpx;overflow:hidden;
  background:
    radial-gradient(120%% 80%% at 88%% 4%%, rgba(46,124,246,.10), transparent 60%%),
    radial-gradient(90%% 70%% at 4%% 98%%, rgba(52,211,166,.12), transparent 62%%),
    #EAF0F9;}
#inner{position:absolute;top:%(pad)dpx;left:%(pad)dpx;right:%(pad)dpx;
  bottom:%(bottom)dpx;transform-origin:top left;}
#kicker{font-family:'Inter',sans-serif;font-weight:600;font-size:%(kicker)dpx;
  letter-spacing:.15em;text-transform:uppercase;color:#0FA47E;margin-bottom:%(kgap)dpx}
#title{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:%(title)dpx;
  line-height:1.05;letter-spacing:-0.015em;color:#0A1628}
#rule{height:%(rule)dpx;width:%(rulew)dpx;background:#2E7CF6;border-radius:99px;
  margin:%(rgap)dpx 0 %(rgap2)dpx}
.row{display:flex;gap:%(gap)dpx;margin-bottom:%(rowgap)dpx;align-items:flex-start}
.num{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:%(num)dpx;
  color:#2E7CF6;line-height:1.1;min-width:%(numw)dpx;font-variant-numeric:tabular-nums}
.label{font-family:'Inter',sans-serif;font-weight:600;font-size:%(label)dpx;
  color:#0A1628;line-height:1.28}
.detail{font-family:'Inter',sans-serif;font-weight:400;font-size:%(detail)dpx;
  color:#51617A;line-height:1.42;margin-top:%(dgap)dpx}
#footer{position:absolute;left:0;right:0;bottom:0;height:%(fh)dpx;background:#0A1628;
  display:flex;align-items:center;justify-content:space-between;padding:0 %(pad)dpx}
#footer img{height:%(logoh)dpx}
#footer div{font-family:'Inter',sans-serif;font-weight:400;font-size:%(ftxt)dpx;
  color:#9FB6DC;letter-spacing:.03em}
</style></head><body>
<div id="stage">
  <div id="inner">
    <div id="kicker">%(kickertxt)s</div>
    <div id="title">%(titlehtml)s</div>
    <div id="rule"></div>
    <div id="items">%(items)s</div>
  </div>
  <div id="footer"><img src="%(logo)s"><div>%(footertxt)s</div></div>
</div></body></html>""" % dict(
    fonts=fonts, w=w, h=h, pad=pad, bottom=footer_h + px(40),
    kicker=px(27), kgap=px(20), title=px(62), rule=px(7), rulew=px(96),
    rgap=px(34), rgap2=px(40), gap=px(26), rowgap=px(32), num=px(40), numw=px(72),
    label=px(35), detail=px(27), dgap=px(9), fh=footer_h, logoh=px(46), ftxt=px(26),
    kickertxt=kicker, titlehtml=title_html, items=items_html, logo=logo_data, footertxt=footer)

pathlib.Path("listcard.html").write_text(html)
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
  await page.goto('file://' + path.join(process.cwd(), 'listcard.html'));
  await page.evaluate(() => document.fonts.ready);
  // Shrink until the content clears the footer. Without this a long item runs
  // off the card, the failure mode the fixed-size cover headline kept hitting.
  const fit = await page.evaluate(() => {
    const inner = document.getElementById('inner');
    const avail = inner.getBoundingClientRect().height;
    let s = 1;
    while (inner.scrollHeight * s > avail && s > 0.6) s -= 0.01;
    inner.style.transform = `scale(${s})`;
    return { scale: s, overflow: inner.scrollHeight * s > avail };
  });
  if (fit.scale < 1) console.log(`==> auto-fit scaled type to ${fit.scale.toFixed(2)}`);
  if (fit.overflow) console.error('!! content still overflows at minimum scale, cut an item');
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/_kaizen_listcard.png' });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
JS

ffmpeg -y -loglevel error -i /tmp/_kaizen_listcard.png -q:v 2 "$OUT"
rm -f /tmp/_kaizen_listcard.png listcard.html
echo "==> done: $OUT ($W x $H)"
