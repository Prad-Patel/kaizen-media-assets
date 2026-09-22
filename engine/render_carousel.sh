#!/usr/bin/env bash
# Render a multi-page PDF carousel for a LinkedIn document post.
#
#   ./render_carousel.sh carousel.json out.pdf [width] [height]
#
# carousel.json:
#   {
#     "footer": "Prad Patel  ·  Kaizen AI Consulting",
#     "slides": [
#       {"type":"cover","kicker":"...","title":["...","..."],"subtitle":"..."},
#       {"type":"item","label":"...","detail":"...","start":"..."},
#       {"type":"end","title":["...","..."],"body":"...","cta":"..."}
#     ]
#   }
#
# Item slides are numbered automatically in the order they appear. Every slide
# auto-fits: a scale factor shrinks until the content clears the footer, so a
# long line can never run off the page.
#
# Defaults to 1080x1350 (4:5). LinkedIn renders document posts at the aspect
# ratio of the PDF, and 4:5 takes the most feed height on mobile.
set -euo pipefail
cd "$(dirname "$0")"

CONFIG="${1:?usage: render_carousel.sh <carousel.json> <out.pdf> [width] [height]}"
OUT="${2:?usage: render_carousel.sh <carousel.json> <out.pdf> [width] [height]}"
W="${3:-1080}"
H="${4:-1350}"

python3 - "$CONFIG" "$W" "$H" <<'PY'
import base64, html as H, json, pathlib, sys

cfg = json.load(open(sys.argv[1]))
w, h = int(sys.argv[2]), int(sys.argv[3])
scale = w / 1080.0
px = lambda v: round(v * scale)

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

footer_txt = H.escape(cfg.get("footer", "kaizenaiconsulting.com"))
slides = cfg.get("slides", [])
n_items = sum(1 for s in slides if s.get("type") == "item")

out, idx = [], 0
for s in slides:
    kind = s.get("type", "item")
    if kind == "cover":
        title = "".join("<div>%s</div>" % H.escape(t) for t in s.get("title", []))
        sub = s.get("subtitle", "")
        out.append(
            '<section class="slide cover"><div class="fit">'
            '<div class="kicker">%s</div><div class="bigtitle">%s</div><div class="rule"></div>'
            '%s</div><div class="swipe">Swipe %s</div>%s</section>' % (
                H.escape(s.get("kicker", "")), title,
                ('<div class="subtitle">%s</div>' % H.escape(sub)) if sub else "",
                "&rsaquo;&rsaquo;",
                '<div class="bar"><img src="%s"><div>%s</div></div>' % (logo_data, footer_txt)))
    elif kind == "end":
        title = "".join("<div>%s</div>" % H.escape(t) for t in s.get("title", []))
        body = s.get("body", "")
        cta = s.get("cta", "")
        out.append(
            '<section class="slide end"><div class="fit">'
            '<div class="bigtitle light">%s</div><div class="rule teal"></div>'
            '%s%s</div>'
            '<div class="bar dark"><img src="%s"><div>%s</div></div></section>' % (
                title,
                ('<div class="endbody">%s</div>' % H.escape(body)) if body else "",
                ('<div class="cta">%s</div>' % H.escape(cta)) if cta else "",
                logo_data, footer_txt))
    else:
        idx += 1
        start = s.get("start", "")
        out.append(
            '<section class="slide item"><div class="fit">'
            '<div class="count">%02d <span>/ %02d</span></div>'
            '<div class="label">%s</div>'
            '<div class="detail">%s</div>%s</div>'
            '<div class="bar"><img src="%s"><div>%s</div></div></section>' % (
                idx, n_items, H.escape(s.get("label", "")), H.escape(s.get("detail", "")),
                ('<div class="start"><span>Start with</span>%s</div>' % H.escape(start)) if start else "",
                logo_data, footer_txt))

html = """<!doctype html><html><head><meta charset="utf-8"><style>
%(fonts)s
@page{size:%(w)dpx %(h)dpx;margin:0}
html,body{margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.slide{position:relative;width:%(w)dpx;height:%(h)dpx;overflow:hidden;break-after:page;
  background:
    radial-gradient(120%% 80%% at 88%% 4%%, rgba(46,124,246,.10), transparent 60%%),
    radial-gradient(90%% 70%% at 4%% 98%%, rgba(52,211,166,.12), transparent 62%%),
    #EAF0F9;}
.slide:last-child{break-after:auto}
.slide.end{background:radial-gradient(110%% 70%% at 82%% 6%%, #16305A, transparent 62%%),#0A1628}
.fit{position:absolute;top:%(pad)dpx;left:%(pad)dpx;right:%(pad)dpx;bottom:%(inbot)dpx;
  transform-origin:top left;display:flex;flex-direction:column;justify-content:center}
.cover .fit,.end .fit,.item .fit{justify-content:center}
.kicker{font-family:'Inter',sans-serif;font-weight:600;font-size:%(kicker)dpx;letter-spacing:.15em;
  text-transform:uppercase;color:#0FA47E;margin-bottom:%(kgap)dpx}
.bigtitle{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:%(big)dpx;
  line-height:1.03;letter-spacing:-0.02em;color:#0A1628}
.bigtitle.light{color:#F2F6FC}
.rule{height:%(rule)dpx;width:%(rulew)dpx;background:#2E7CF6;border-radius:99px;margin:%(rgap)dpx 0}
.rule.teal{background:#34D3A6}
.subtitle{font-family:'Inter',sans-serif;font-weight:400;font-size:%(sub)dpx;line-height:1.45;
  color:#51617A;max-width:88%%}
.swipe{position:absolute;right:%(pad)dpx;bottom:%(swipe)dpx;font-family:'Inter',sans-serif;
  font-weight:600;font-size:%(swipetxt)dpx;letter-spacing:.12em;text-transform:uppercase;color:#2E7CF6}
.count{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:%(count)dpx;color:#2E7CF6;
  letter-spacing:-0.01em;margin-bottom:%(cgap)dpx;font-variant-numeric:tabular-nums}
.count span{font-size:%(countsm)dpx;color:#9AAAC4}
.label{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:%(label)dpx;line-height:1.08;
  letter-spacing:-0.015em;color:#0A1628;margin-bottom:%(lgap)dpx}
.detail{font-family:'Inter',sans-serif;font-weight:400;font-size:%(detail)dpx;line-height:1.5;
  color:#41526B;max-width:94%%}
.start{margin-top:%(sgap)dpx;font-family:'Inter',sans-serif;font-weight:600;font-size:%(startsz)dpx;
  line-height:1.4;color:#0A1628;border-left:%(sbar)dpx solid #34D3A6;padding-left:%(spad)dpx}
.start span{display:block;font-weight:600;font-size:%(startlbl)dpx;letter-spacing:.13em;
  text-transform:uppercase;color:#0FA47E;margin-bottom:%(startgap)dpx}
.endbody{font-family:'Inter',sans-serif;font-weight:400;font-size:%(sub)dpx;line-height:1.5;
  color:#B9C9E2;max-width:92%%}
.cta{font-family:'Inter',sans-serif;font-weight:600;font-size:%(cta)dpx;line-height:1.4;
  color:#34D3A6;margin-top:%(ctagap)dpx;max-width:92%%}
.bar{position:absolute;left:0;right:0;bottom:0;height:%(fh)dpx;background:#0A1628;display:flex;
  align-items:center;justify-content:space-between;padding:0 %(pad)dpx}
.bar.dark{background:transparent;border-top:1px solid rgba(255,255,255,.12)}
.bar img{height:%(logoh)dpx}
.bar div{font-family:'Inter',sans-serif;font-weight:400;font-size:%(ftxt)dpx;color:#9FB6DC;letter-spacing:.03em}
</style></head><body>%(slides)s</body></html>""" % dict(
    fonts=fonts, w=w, h=h, pad=px(80), inbot=px(150),
    kicker=px(27), kgap=px(22), big=px(74), rule=px(8), rulew=px(104), rgap=px(38),
    sub=px(30), swipe=px(150), swipetxt=px(24),
    count=px(34), countsm=px(24), cgap=px(28), label=px(62), lgap=px(26), detail=px(31),
    sgap=px(42), startsz=px(29), sbar=px(5), spad=px(24), startlbl=px(21), startgap=px(8),
    cta=px(31), ctagap=px(36), fh=px(112), logoh=px(46), ftxt=px(26),
    slides="".join(out))

pathlib.Path("carousel.html").write_text(html)
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
  const fits = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.fit').forEach((el, i) => {
      const avail = el.getBoundingClientRect().height;
      let s = 1;
      while (el.scrollHeight * s > avail && s > 0.6) s -= 0.01;
      el.style.transform = `scale(${s})`;
      if (s < 1) out.push({ slide: i + 1, scale: +s.toFixed(2) });
    });
    return out;
  });
  fits.forEach(f => console.log(`==> slide ${f.slide} auto-fit to ${f.scale}`));
  await page.waitForTimeout(200);
  await page.pdf({ path: process.env.OUT, width: `${w}px`, height: `${h}px`,
                   printBackground: true, pageRanges: '' });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
JS

rm -f carousel.html
echo "==> done: $OUT ($W x $H)"
