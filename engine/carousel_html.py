"""Build the HTML for a Kaizen carousel, static (PDF) or animated (video).

Shared by render_carousel.sh and render_carousel_video.sh so the two formats
can never drift apart: one config, one layout, one set of icons.

Icons are inline SVG in the brand palette, flat and geometric to match the
house illustration style. Nothing is AI-painted and no glyph is ever drawn as
artwork, same rule as the rest of the engine.

When animated, the page exposes window.__seek(t) and positions every element
deterministically from t, so a frame capture is reproducible. No CSS
animations or transitions are used anywhere, for the same reason.
"""
import base64
import html as H
import pathlib

NAVY = "#0A1628"
BLUE = "#2E7CF6"
TEAL = "#34D3A6"
PAPER = "#EAF0F9"

# Flat geometric icons, 120x120 viewBox. Stroke-based so they stay crisp at
# any slide size and read at carousel thumbnail scale.
ICONS = {
    "phone": """
      <circle cx="60" cy="60" r="46" fill="none" stroke="{blue}" stroke-width="3" opacity=".28"/>
      <path d="M41 34c4-2 8-1 10 3l5 9c2 3 1 6-2 8l-4 3c3 8 8 13 16 16l3-4c2-3 5-4 8-2l9 5c4 2 5 6 3 10l-3 5c-2 4-6 5-10 4C58 87 41 70 33 47c-1-4 0-8 4-10z"
            fill="{navy}"/>
      <path d="M78 26a30 30 0 0 1 18 18" fill="none" stroke="{teal}" stroke-width="6" stroke-linecap="round"/>
      <path d="M72 14a44 44 0 0 1 34 34" fill="none" stroke="{teal}" stroke-width="6" stroke-linecap="round" opacity=".45"/>
    """,
    "quote": """
      <rect x="24" y="16" width="62" height="84" rx="7" fill="none" stroke="{navy}" stroke-width="7"/>
      <path d="M38 40h34M38 56h34M38 72h20" stroke="{blue}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="86" cy="80" r="21" fill="{teal}"/>
      <path d="M79 80l5 6 10-12" fill="none" stroke="{navy}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    """,
    "invoice": """
      <path d="M28 14h52a5 5 0 0 1 5 5v82l-12-8-11 8-11-8-11 8-12-8V19a5 5 0 0 1 5-5z"
            fill="none" stroke="{navy}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M42 38h28M42 54h28" stroke="{blue}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="88" cy="76" r="20" fill="{teal}"/>
      <path d="M88 65v11l7 5" fill="none" stroke="{navy}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    """,
    "followup": """
      <rect x="16" y="28" width="76" height="54" rx="7" fill="none" stroke="{navy}" stroke-width="7"/>
      <path d="M16 34l38 26 38-26" fill="none" stroke="{blue}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M78 90a22 22 0 1 0-16-6" fill="none" stroke="{teal}" stroke-width="7" stroke-linecap="round"/>
      <path d="M58 70v16h16" fill="none" stroke="{teal}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    """,
    "repeat": """
      <path d="M18 24h56a6 6 0 0 1 6 6v30a6 6 0 0 1-6 6H40l-16 12V66h-6a6 6 0 0 1-6-6V30a6 6 0 0 1 6-6z"
            fill="none" stroke="{navy}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M92 44h4a6 6 0 0 1 6 6v30a6 6 0 0 1-6 6h-6v12L74 86H56"
            fill="none" stroke="{blue}" stroke-width="7" stroke-linejoin="round" opacity=".55"/>
      <path d="M34 40h26M34 52h16" stroke="{teal}" stroke-width="7" stroke-linecap="round"/>
    """,
    "grid": """
      <rect x="14" y="14" width="40" height="40" rx="6" fill="none" stroke="{navy}" stroke-width="7"/>
      <rect x="66" y="14" width="40" height="40" rx="6" fill="none" stroke="{navy}" stroke-width="7" opacity=".4"/>
      <rect x="14" y="66" width="40" height="40" rx="6" fill="none" stroke="{navy}" stroke-width="7" opacity=".4"/>
      <rect x="66" y="66" width="40" height="40" rx="6" fill="{teal}"/>
      <path d="M76 86l6 7 12-14" fill="none" stroke="{navy}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    """,
    "target": """
      <circle cx="60" cy="60" r="44" fill="none" stroke="{navy}" stroke-width="7" opacity=".35"/>
      <circle cx="60" cy="60" r="27" fill="none" stroke="{blue}" stroke-width="7"/>
      <circle cx="60" cy="60" r="11" fill="{teal}"/>
    """,
}


def _icon_svg(name, size):
    body = ICONS.get(name)
    if not body:
        return ""
    body = body.format(navy=NAVY, blue=BLUE, teal=TEAL)
    return ('<svg class="icon" width="%d" height="%d" viewBox="0 0 120 120" '
            'fill="none" xmlns="http://www.w3.org/2000/svg">%s</svg>' % (size, size, body))


def _font_face(fam, weight, path):
    data = base64.b64encode(pathlib.Path(path).read_bytes()).decode()
    return ("@font-face{font-family:'%s';font-weight:%d;font-style:normal;"
            "src:url(data:font/woff2;base64,%s) format('woff2');}" % (fam, weight, data))


def build(cfg, w, h, animated=False, timing=None):
    scale = w / 1080.0
    px = lambda v: round(v * scale)

    wordmark = "data:image/png;base64,%s" % base64.b64encode(
        pathlib.Path("brand/logo.png").read_bytes()).decode()
    kmark = "data:image/png;base64,%s" % base64.b64encode(
        pathlib.Path("brand/logo_small.png").read_bytes()).decode()

    fonts = "".join([
        _font_face("Space Grotesk", 700, "fonts/space-grotesk-latin-700-normal.woff2"),
        _font_face("Space Grotesk", 500, "fonts/space-grotesk-latin-500-normal.woff2"),
        _font_face("Inter", 600, "fonts/inter-latin-600-normal.woff2"),
        _font_face("Inter", 400, "fonts/inter-latin-400-normal.woff2"),
    ])

    site = H.escape(cfg.get("footer", "kaizenaiconsulting.com"))
    slides = cfg.get("slides", [])
    n_items = sum(1 for s in slides if s.get("type") == "item")

    def bar(dark=False):
        return ('<div class="bar%s"><img src="%s"><div>%s</div></div>'
                % (" dark" if dark else "", wordmark, site))

    def anim(el, delay):
        """Tag an element for the seek function; inert when not animated."""
        return ' data-a="%0.2f"' % delay if animated else ""

    out, idx = [], 0
    for s in slides:
        kind = s.get("type", "item")
        icon = _icon_svg(s.get("icon", ""), px(104))
        if kind == "cover":
            title = "".join("<div>%s</div>" % H.escape(t) for t in s.get("title", []))
            sub = s.get("subtitle", "")
            out.append(
                '<section class="slide cover"><div class="fit">'
                '<img class="mark"%s src="%s">'
                '<div class="kicker"%s>%s</div>'
                '<div class="bigtitle"%s>%s</div>'
                '<div class="rule"%s></div>'
                '%s</div>%s%s</section>' % (
                    anim("mark", 0.0), kmark,
                    anim("kicker", 0.18), H.escape(s.get("kicker", "")),
                    anim("title", 0.30), title,
                    anim("rule", 0.48),
                    ('<div class="subtitle"%s>%s</div>' % (anim("sub", 0.58), H.escape(sub))) if sub else "",
                    ('<div class="swipe"%s>Swipe &rsaquo;&rsaquo;</div>' % anim("swipe", 0.8)) if not animated else "",
                    bar()))
        elif kind == "end":
            title = "".join("<div>%s</div>" % H.escape(t) for t in s.get("title", []))
            out.append(
                '<section class="slide end"><div class="fit">'
                '%s<div class="bigtitle light"%s>%s</div><div class="rule teal"%s></div>'
                '%s%s</div>%s</section>' % (
                    ('<div class="iconwrap end"%s>%s</div>' % (anim("icon", 0.0), icon)) if icon else "",
                    anim("title", 0.16), title, anim("rule", 0.32),
                    ('<div class="endbody"%s>%s</div>' % (anim("body", 0.42), H.escape(s.get("body", "")))) if s.get("body") else "",
                    ('<div class="cta"%s>%s</div>' % (anim("cta", 0.58), H.escape(s.get("cta", "")))) if s.get("cta") else "",
                    bar(dark=True)))
        else:
            idx += 1
            start = s.get("start", "")
            out.append(
                '<section class="slide item"><div class="fit">'
                '%s'
                '<div class="count"%s>%02d <span>/ %02d</span></div>'
                '<div class="label"%s>%s</div>'
                '<div class="detail"%s>%s</div>%s</div>%s</section>' % (
                    ('<div class="iconwrap"%s>%s</div>' % (anim("icon", 0.0), icon)) if icon else "",
                    anim("count", 0.14), idx, n_items,
                    anim("label", 0.24), H.escape(s.get("label", "")),
                    anim("detail", 0.38), H.escape(s.get("detail", "")),
                    ('<div class="start"%s><span>Start with</span>%s</div>'
                     % (anim("start", 0.54), H.escape(start))) if start else "",
                    bar()))

    # Auto-fit runs in both directions: grow a sparse slide until it fills the
    # frame, shrink a long one until it clears the footer. Width and height are
    # divided by the scale before transforming, so the scaled box lands back on
    # the original bounds and text re-wraps at the right measure instead of
    # overflowing the right edge.
    fit_js = """<script>
window.__autofit=function(maxUp){
  maxUp=maxUp||1.22;
  var out=[];
  [].slice.call(document.querySelectorAll('.fit')).forEach(function(el,i){
    var r=el.getBoundingClientRect(), availH=r.height, availW=r.width;
    el.style.right='auto'; el.style.bottom='auto';
    var chosen=0.6;
    for(var s=maxUp;s>=0.6;s-=0.02){
      el.style.transform='none';
      el.style.width=(availW/s)+'px';
      el.style.height=(availH/s)+'px';
      if(el.scrollHeight*s<=availH+1){chosen=s;break;}
    }
    el.style.width=(availW/chosen)+'px';
    el.style.height=(availH/chosen)+'px';
    el.style.transform='scale('+chosen.toFixed(3)+')';
    out.push({slide:i+1,scale:+chosen.toFixed(2)});
  });
  return out;
};
</script>"""

    seek_js = ""
    if animated:
        # Seconds per slide. A deck can override with a "timing" key; the
        # defaults give a 5-item deck about 45s, slow enough to read each
        # slide before it moves on.
        t = timing or cfg.get("timing") or {}
        seek_js = """<script>
(function(){
  var COVER=%(cover)s, ITEM=%(item)s, END=%(end)s, XF=0.42;
  var slides=[].slice.call(document.querySelectorAll('.slide'));
  var spans=slides.map(function(s){
    return s.classList.contains('cover')?COVER:(s.classList.contains('end')?END:ITEM);
  });
  var starts=[],acc=0;
  spans.forEach(function(d){starts.push(acc);acc+=d;});
  window.__duration=acc;
  var bar=document.getElementById('prog');
  function ease(p){p=Math.max(0,Math.min(1,p));return 1-Math.pow(1-p,3);}
  window.__seek=function(t){
    if(bar) bar.style.width=(Math.max(0,Math.min(1,t/acc))*100)+'%%';
    slides.forEach(function(s,i){
      var last=(i===slides.length-1);
      // Every slide but the first starts fading in XF early, over the tail of
      // the one before. Without that overlap the outgoing slide reaches zero
      // opacity before the incoming one leaves it, and the transition shows a
      // frame of empty background.
      var e=t-starts[i]+(i?XF:0), span=spans[i]+(i?XF:0);
      if(e<0||(!last&&e>span)){s.style.opacity=0;s.style.visibility='hidden';return;}
      s.style.visibility='visible';
      var o=ease(e/XF);
      if(!last)o=Math.min(o,ease((span-e)/XF));
      s.style.opacity=o;
      [].slice.call(s.querySelectorAll('[data-a]')).forEach(function(el){
        var p=ease((e-parseFloat(el.dataset.a))/0.55);
        el.style.opacity=p;
        el.style.transform='translateY('+((1-p)*26).toFixed(2)+'px)';
      });
      var ic=s.querySelector('.icon');
      if(ic){var p=ease(e/0.7);ic.style.transform='scale('+(0.84+0.16*p).toFixed(3)+')';}
    });
  };
  window.__seek(0);
})();
</script>""" % dict(cover=t.get("cover", 5.0), item=t.get("item", 6.6), end=t.get("end", 7.0))

    prog = '<div id="progwrap"><div id="prog"></div></div>' if animated else ""
    # Animated slides overlay each other and are revealed by __seek; the PDF
    # needs them in normal flow so each one becomes its own page.
    slidepos = "position:absolute;inset:0;" if animated else "position:relative;"

    css = """
%(fonts)s
@page{size:%(w)dpx %(h)dpx;margin:0}
html,body{margin:0;padding:0;background:%(paper)s;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.slide{%(slidepos)swidth:%(w)dpx;height:%(h)dpx;overflow:hidden;break-after:page;
  background:
    radial-gradient(120%% 80%% at 88%% 4%%, rgba(46,124,246,.10), transparent 60%%),
    radial-gradient(90%% 70%% at 4%% 98%%, rgba(52,211,166,.12), transparent 62%%),
    %(paper)s;}
.slide:last-child{break-after:auto}
.slide.end{background:radial-gradient(110%% 70%% at 82%% 6%%, #16305A, transparent 62%%),%(navy)s}
.fit{position:absolute;top:%(pad)dpx;left:%(pad)dpx;right:%(pad)dpx;bottom:%(inbot)dpx;
  transform-origin:top left;display:flex;flex-direction:column;justify-content:center}
.mark{width:%(markw)dpx;margin-bottom:%(markgap)dpx}
.iconwrap{width:%(iconbox)dpx;height:%(iconbox)dpx;border-radius:%(iconr)dpx;background:#fff;
  display:flex;align-items:center;justify-content:center;margin-bottom:%(icongap)dpx;
  box-shadow:0 %(icons1)dpx %(icons2)dpx rgba(10,22,40,.10)}
.iconwrap.end{background:rgba(255,255,255,.07);box-shadow:none;
  border:%(iconbd)dpx solid rgba(255,255,255,.14)}
.icon{transform-origin:center}
.kicker{font-family:'Inter',sans-serif;font-weight:600;font-size:%(kicker)dpx;letter-spacing:.15em;
  text-transform:uppercase;color:#0FA47E;margin-bottom:%(kgap)dpx}
.bigtitle{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:%(big)dpx;
  line-height:1.03;letter-spacing:-0.02em;color:%(navy)s}
.bigtitle.light{color:#F2F6FC}
.rule{height:%(rule)dpx;width:%(rulew)dpx;background:%(blue)s;border-radius:99px;margin:%(rgap)dpx 0}
.rule.teal{background:%(teal)s}
.subtitle{font-family:'Inter',sans-serif;font-weight:400;font-size:%(sub)dpx;line-height:1.45;
  color:#51617A;max-width:88%%}
.swipe{position:absolute;right:%(pad)dpx;bottom:%(swipe)dpx;font-family:'Inter',sans-serif;
  font-weight:600;font-size:%(swipetxt)dpx;letter-spacing:.12em;text-transform:uppercase;color:%(blue)s}
.count{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:%(count)dpx;color:%(blue)s;
  letter-spacing:-0.01em;margin-bottom:%(cgap)dpx;font-variant-numeric:tabular-nums}
.count span{font-size:%(countsm)dpx;color:#9AAAC4}
.label{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:%(label)dpx;line-height:1.08;
  letter-spacing:-0.015em;color:%(navy)s;margin-bottom:%(lgap)dpx}
.detail{font-family:'Inter',sans-serif;font-weight:400;font-size:%(detail)dpx;line-height:1.5;
  color:#41526B;max-width:94%%}
.start{margin-top:%(sgap)dpx;font-family:'Inter',sans-serif;font-weight:600;font-size:%(startsz)dpx;
  line-height:1.4;color:%(navy)s;border-left:%(sbar)dpx solid %(teal)s;padding-left:%(spad)dpx}
.start span{display:block;font-weight:600;font-size:%(startlbl)dpx;letter-spacing:.13em;
  text-transform:uppercase;color:#0FA47E;margin-bottom:%(startgap)dpx}
.endbody{font-family:'Inter',sans-serif;font-weight:400;font-size:%(sub)dpx;line-height:1.5;
  color:#B9C9E2;max-width:92%%}
.cta{font-family:'Inter',sans-serif;font-weight:600;font-size:%(cta)dpx;line-height:1.4;
  color:%(teal)s;margin-top:%(ctagap)dpx;max-width:92%%}
.bar{position:absolute;left:0;right:0;bottom:0;height:%(fh)dpx;background:%(navy)s;display:flex;
  align-items:center;justify-content:space-between;padding:0 %(pad)dpx}
.bar.dark{background:transparent;border-top:1px solid rgba(255,255,255,.14)}
.bar img{width:%(barmark)dpx}
.bar div{font-family:'Inter',sans-serif;font-weight:600;font-size:%(ftxt)dpx;color:#9FB6DC;letter-spacing:.06em}
#progwrap{position:absolute;left:0;right:0;bottom:0;height:%(ph)dpx;background:rgba(10,22,40,.14);z-index:9}
#prog{height:100%%;width:0;background:linear-gradient(90deg,%(blue)s,%(teal)s)}
""" % dict(
        fonts=fonts, w=w, h=h, slidepos=slidepos, paper=PAPER, navy=NAVY, blue=BLUE, teal=TEAL,
        pad=px(80), inbot=px(150), covbot=px(215), markw=px(132), markgap=px(44), icongap=px(36),
        iconbox=px(152), iconr=px(32), icons1=px(12), icons2=px(34), iconbd=px(2),
        kicker=px(27), kgap=px(22), big=px(74), rule=px(8), rulew=px(104), rgap=px(38),
        sub=px(30), swipe=px(150), swipetxt=px(24),
        count=px(34), countsm=px(24), cgap=px(22), label=px(62), lgap=px(26), detail=px(31),
        sgap=px(40), startsz=px(29), sbar=px(5), spad=px(24), startlbl=px(21), startgap=px(8),
        cta=px(31), ctagap=px(36), fh=px(116), barmark=px(196), ftxt=px(25), ph=px(9))

    return ("<!doctype html><html><head><meta charset=\"utf-8\"><style>%s</style></head>"
            "<body>%s%s%s%s</body></html>" % (css, "".join(out), prog, fit_js, seek_js))
