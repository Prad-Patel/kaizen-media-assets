#!/usr/bin/env python3
"""Kaizen 'which Claude model for which job' infographic (2026-11-12).

Every word is real typography: HTML rendered by headless Chromium.
  python3 drafts/2026-11-12-claude-models-infographic.py OUT_DIR
writes OUT_DIR/4x5.png (1080x1350) and OUT_DIR/3x2.png (1200x800).
"""
import base64, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ENG = ROOT / "engine"
OUT = pathlib.Path(sys.argv[1]).resolve()
OUT.mkdir(parents=True, exist_ok=True)


def b64(p):
    return base64.b64encode((ENG / p).read_bytes()).decode()


def face(fam, w, p):
    return ("@font-face{font-family:'%s';font-weight:%d;src:url(data:font/woff2;base64,%s) format('woff2');}"
            % (fam, w, b64(p)))


FONTS = "".join([
    face("Space Grotesk", 700, "fonts/space-grotesk-latin-700-normal.woff2"),
    face("Space Grotesk", 500, "fonts/space-grotesk-latin-500-normal.woff2"),
    face("Inter", 400, "fonts/inter-latin-400-normal.woff2"),
    face("Inter", 600, "fonts/inter-latin-600-normal.woff2"),
    face("Inter", 800, "fonts/inter-latin-800-normal.woff2"),
])
LOGO = "data:image/png;base64," + b64("brand/logo.png")
LOGO_S = "data:image/png;base64," + b64("brand/logo_small.png")

NAVY, BLUE, TEAL, RED, PAPER = "#0A1628", "#2E7CF6", "#34D3A6", "#FF5A5F", "#EAF0F9"

# (model, colour, Claude's own line, small-business jobs, trade-off chip, branch question)
MODELS = [
    ("Opus 5.5", BLUE, "Claude's pick for everyday work",
     "Quotes, client emails, checking a contract", "Start here", None),
    ("Sonnet 5.5", TEAL, "Strong on most tasks, easy on your usage",
     "Quick replies, rewrites, social posts", "Faster, more runway", "Opus breezing through it?"),
    ("Fable 5.2", NAVY, "The most capable, for long, open-ended work",
     "A big research question, a business plan", "Deepest, uses the most", "Ambitious and open-ended?"),
    ("Haiku 5.5", RED, "The fastest, for high-volume work",
     "Sorting hundreds of enquiries in an automation", "Behind the scenes", "Running it in an automation?"),
]


def page(w, h, body, extra_css):
    return """<!doctype html><html><head><meta charset="utf-8"><style>%s
*{box-sizing:border-box}html,body{margin:0}
#s{position:relative;width:%dpx;height:%dpx;overflow:hidden;background:%s;color:%s;font-family:'Inter',sans-serif}
.kick{font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#0FA47E}
.head{font-family:'Space Grotesk',sans-serif;font-weight:700;line-height:1.02;letter-spacing:-.015em}
.head .b{color:%s}
.route{position:relative}
.spine{position:absolute;border-radius:99px;background:%s}
.stop{position:relative;display:flex;align-items:stretch}
.dot{position:absolute;border-radius:50%%;background:%s;z-index:2}
.branch{position:absolute;border-radius:99px;z-index:1}
.card{background:#fff;border-radius:22px;box-shadow:0 2px 0 rgba(10,22,40,.06),0 10px 28px rgba(10,22,40,.08);position:relative;overflow:hidden}
.card .bar{position:absolute;left:0;top:0;bottom:0}
.name{font-family:'Space Grotesk',sans-serif;font-weight:700;letter-spacing:-.01em;line-height:1}
.line{color:#3B4A63;line-height:1.25}
.job{font-weight:600;line-height:1.25}
.job span{font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#7A8AA5}
.chip{position:absolute;font-weight:600;border-radius:99px;white-space:nowrap}
.q{position:absolute;font-weight:600;color:%s;font-style:normal;white-space:nowrap}
.q:before{content:"";display:inline-block;vertical-align:middle;border-radius:50%%}
%s
</style></head><body><div id="s">%s</div></body></html>""" % (
        FONTS, w, h, PAPER, NAVY, BLUE, NAVY, PAPER, NAVY, extra_css, body)


def chip_style(col):
    if col == NAVY:
        return "background:%s;color:#fff" % NAVY
    if col == TEAL:
        return "background:#D3F6EC;color:#0B6B53"
    if col == RED:
        return "background:#FFE1E2;color:#B3262B"
    return "background:#DCE8FD;color:#1A55B5"


def route(card_w, card_h, gap, s):
    """Stacked stops: a navy spine on the left, a coloured branch into each card."""
    spine_x = round(26 * s)
    left = round(84 * s)
    out = []
    for i, (name, col, line, job, chip, q) in enumerate(MODELS):
        top = i * (card_h + gap)
        cy = top + card_h // 2
        dot = round(30 * s)
        ring = "box-shadow:0 0 0 %dpx %s;" % (round(7 * s), col)
        out.append('<div class="dot" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx;%s"></div>'
                   % (spine_x - dot // 2 + round(5 * s), cy - dot // 2, dot, dot, ring))
        out.append('<div class="branch" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx;background:%s"></div>'
                   % (spine_x + round(5 * s), cy - round(5 * s), left - spine_x, round(10 * s), col))
        if q:
            out.append('<div class="q" style="left:%dpx;top:%dpx;font-size:%dpx">%s</div>'
                       % (left + round(4 * s), top - gap + round((gap - 24 * s) / 2) - round(2 * s), round(21 * s), "&#8627;&nbsp;" + q))
        pad = round(26 * s)
        out.append(
            '<div class="card" style="position:absolute;left:%dpx;top:%dpx;width:%dpx;height:%dpx;padding:%dpx %dpx %dpx %dpx">'
            '<div class="bar" style="width:%dpx;background:%s"></div>'
            '<div class="name" style="font-size:%dpx;margin-bottom:%dpx">%s</div>'
            '<div class="line" style="font-size:%dpx;margin-bottom:%dpx">%s</div>'
            '<div class="job" style="font-size:%dpx"><span style="font-size:%dpx">For you&nbsp;&nbsp;</span>%s</div>'
            '<div class="chip" style="right:%dpx;top:%dpx;font-size:%dpx;padding:%dpx %dpx;%s">%s</div>'
            '</div>' % (
                left, top, card_w, card_h, round(pad * .8), pad, pad, pad + round(10 * s),
                round(12 * s), col,
                round(44 * s), round(8 * s), name,
                round(23 * s), round(12 * s), line,
                round(23 * s), round(16 * s), job,
                pad, round(pad * .8), round(18 * s), round(7 * s), round(16 * s), chip_style(col), chip))
    total_h = 4 * card_h + 3 * gap
    out.insert(0, '<div class="spine" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx"></div>'
               % (spine_x, card_h // 2, round(10 * s), total_h - card_h))
    return '<div class="route" style="width:%dpx;height:%dpx">%s</div>' % (left + card_w, total_h, "".join(out))


def footer(w, fh, padx, fs):
    return ('<div style="position:absolute;left:0;right:0;bottom:0;height:%dpx;background:%s;display:flex;'
            'align-items:center;justify-content:space-between;padding:0 %dpx;color:#9FB6DC;font-size:%dpx">'
            '<div style="display:flex;align-items:center;gap:%dpx"><img src="%s" style="height:%dpx">'
            '<span>Source: Claude on LinkedIn, 11 Nov 2026</span></div>'
            '<span style="letter-spacing:.04em">kaizenaiconsulting.com</span></div>'
            % (fh, NAVY, padx, fs, round(fs * .9), LOGO_S, round(fh * .42), ))


def build_4x5():
    w, h, s = 1080, 1350, 1.0
    body = (
        '<div style="position:absolute;left:64px;top:60px;right:64px">'
        '<div class="kick" style="font-size:24px;margin-bottom:16px">Claude &middot; picking a model</div>'
        '<div class="head" style="font-size:84px">Claude: which model<br><span class="b">for which job?</span></div>'
        '<div style="font-size:26px;color:#3B4A63;margin-top:20px;line-height:1.3">Anthropic\'s own advice, turned into everyday small-business work.</div>'
        '</div>'
        '<div style="position:absolute;left:52px;top:388px">%s</div>'
        '%s' % (route(880, 172, 40, s), footer(w, 92, 64, 22)))
    return w, h, page(w, h, body, "")


def build_3x2():
    w, h = 1200, 800
    s = 0.74
    body = (
        '<div style="position:absolute;left:56px;top:60px;width:440px">'
        '<div class="kick" style="font-size:19px;margin-bottom:14px">Claude &middot; picking a model</div>'
        '<div class="head" style="font-size:56px">Claude:<br>which model<br><span class="b">for which job?</span></div>'
        '<div style="font-size:21px;color:#3B4A63;margin-top:22px;line-height:1.35">Anthropic\'s own advice, turned into everyday small-business work.</div>'
        '</div>'
        '<div style="position:absolute;left:496px;top:40px">%s</div>'
        '%s' % (route(600, 136, 34, s), footer(w, 78, 56, 19)))
    return w, h, page(w, h, body, "")


JS = r"""
const { chromium } = require('playwright-core');
(async () => {
  const [html, png, w, h] = process.argv.slice(1);
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    args: ['--force-device-scale-factor=1', '--hide-scrollbars'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  await p.goto('file://' + html);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: png });
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
"""

for tag, fn in (("4x5", build_4x5), ("3x2", build_3x2)):
    w, h, html = fn()
    hp = OUT / ("%s.html" % tag)
    hp.write_text(html)
    subprocess.run(["node", "-e", JS, str(hp), str(OUT / ("%s.png" % tag)), str(w), str(h)],
                   cwd=ENG, check=True)
    print("wrote", OUT / ("%s.png" % tag))
