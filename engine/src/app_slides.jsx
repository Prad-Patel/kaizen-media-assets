// Kaizen explainer video: a hook over the layered scene, then animated
// information slides that morph into each other, then the Kaizen end card.
// Every word is real typography. Copy comes from window.__CONFIG (see
// drafts/*-slides.json); the slide layouts are the reusable part.
//   slides: hook (transparent, sits over the render_layers base clip),
//   split (one block splits into five), steps (threshold stairs + meter),
//   bars (bars against a threshold line), points (penalty panels),
//   list (numbered actions), end (navy card).
import React from "react";
import { createRoot } from "react-dom/client";
import { motion, useTransform } from "framer-motion";
import { T, seg, easeOutBack, easeOutCubic, easeInCubic, ACCENT, TEAL, RED, EndCard } from "./shared";

const C = window.__CONFIG;
const W = 1080, H = 1920;
const NAVY = "#0A1628", INK = "#0E2038", PAPER = "#EAF0F9", MUTED = "#4E6485", WHITE = "#FFFFFF";
const HL = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.02em" };
const BODY = { fontFamily: "'Inter', sans-serif", fontWeight: 500, lineHeight: 1.3 };
const S = C.times; // slide start times
const END = C.duration;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (e, p) => e(clamp(p));
const bounce = (p) => { const n = 7.5625, d = 2.75; if (p < 1 / d) return n * p * p; if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75; if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375; return n * (p -= 2.625 / d) * p + 0.984375; };

// element visible from t0 to t1 with a rise-in and a lift-out
function R({ t0, t1, x = 0, y = 0, w, h, dy = 40, scaleIn = false, children, style = {} }) {
  const o = useTransform(T, (t) => (t < t0 ? 0 : seg(t, t0, t0 + 0.45) * (1 - seg(t, t1, t1 + 0.35, easeInCubic))));
  const ty = useTransform(T, (t) => (1 - seg(t, t0, t0 + 0.55)) * dy - seg(t, t1, t1 + 0.35, easeInCubic) * 50);
  const sc = useTransform(T, (t) => (scaleIn ? 0.8 + 0.2 * seg(t, t0, t0 + 0.55, easeOutBack) : 1));
  return <motion.div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: o, y: ty, scale: sc, ...style }}>{children}</motion.div>;
}

function Word({ t0, children, color }) {
  const o = useTransform(T, (t) => seg(t, t0, t0 + 0.3));
  const y = useTransform(T, (t) => (1 - seg(t, t0, t0 + 0.4)) * 36);
  return <motion.span style={{ display: "inline-block", opacity: o, y, marginRight: "0.26em", color }}>{children}</motion.span>;
}
// headline that lands word by word
function Head({ t0, t1, y, text, color, size = 92, x = 84, w = 912, step = 0.09 }) {
  const o = useTransform(T, (t) => 1 - seg(t, t1, t1 + 0.35, easeInCubic));
  return (
    <motion.div style={{ position: "absolute", left: x, top: y, width: w, ...HL, fontSize: size, color, opacity: o }}>
      {text.split(" ").map((wd, i) => <Word key={i} t0={t0 + i * step}>{wd}</Word>)}
    </motion.div>
  );
}
function Para({ t0, t1, y, text, color, size = 44, x = 84, w = 912 }) {
  return <R t0={t0} t1={t1} x={x} y={y} w={w} dy={26}><div style={{ ...BODY, fontSize: size, color }}>{text}</div></R>;
}

// circular wipe that paints a new slide background
function Wipe({ t0, bg, cx, cy, dur = 0.85, grad }) {
  const cp = useTransform(T, (t) => `circle(${ease(easeOutCubic, (t - t0) / dur) * 2600}px at ${cx}px ${cy}px)`);
  return <motion.div style={{ position: "absolute", inset: 0, background: grad || bg, clipPath: cp, WebkitClipPath: cp }} />;
}

function Logo({ t0, dark }) {
  const o = useTransform(T, (t) => seg(t, t0, t0 + 0.5) * 0.9);
  return <motion.img src="brand/logo_small.png" style={{ position: "absolute", top: 64, left: 64, width: 96, opacity: o }} />;
}
function Progress() {
  const w = useTransform(T, (t) => `${clamp(t / END) * 100}%`);
  return <div style={{ position: "absolute", left: 64, right: 64, bottom: 60, height: 8, borderRadius: 4, background: "rgba(120,140,170,.28)" }}>
    <motion.div style={{ height: "100%", width: w, borderRadius: 4, background: `linear-gradient(90deg, ${ACCENT}, ${TEAL})` }} /></div>;
}

// ------------------------------------------------------------- slide 1: hook
function Hook() {
  const h = C.hook, t0 = 0.2, t1 = S[1] - 0.1;
  const big = useTransform(T, (t) => 0.9 + 0.1 * seg(t, 0.2, 0.9, easeOutBack));
  return (
    <>
      <R t0={0.2} t1={t1} x={84} y={150} w={912} dy={30}>
        <div style={{ ...HL, fontSize: 36, letterSpacing: "0.12em", color: TEAL, textTransform: "uppercase" }}>{h.kicker}</div>
      </R>
      <motion.div style={{ position: "absolute", left: 84, top: 215, width: 912, ...HL, fontSize: 132, color: INK, scale: big, transformOrigin: "0 50%",
        opacity: useTransform(T, (t) => seg(t, 0.2, 0.7) * (1 - seg(t, t1, t1 + 0.35, easeInCubic))) }}>{h.big}</motion.div>
      <Head t0={0.9} t1={t1} y={375} text={h.line} color={INK} size={54} step={0.07} />
    </>
  );
}

// -------------------------------------------------------- slide 2: five filings
function Split() {
  const c = C.split, a = S[1], b = S[2];
  const x0 = 96, bw = 222, gap = 22, by = 700, bh = 190;
  const splitT = a + 3.0;
  const lab = ["Q1", "Q2", "Q3", "Q4"];
  return (
    <>
      <Head t0={a + 0.5} t1={b - 0.3} y={190} text={c.title} color={WHITE} size={100} />
      <R t0={a + 1.2} t1={splitT + 0.2} x={x0} y={by + 40} w={888} dy={20}>
        <div style={{ ...HL, fontSize: 50, color: "#9FB6DC", textAlign: "center", position: "absolute", top: -90, width: 888 }}>{c.before}</div>
      </R>
      {lab.map((l, i) => <Quarter key={i} i={i} l={l} x0={x0} bw={bw} gap={gap} by={by} bh={bh} a={a} splitT={splitT} b={b} />)}
      <FinalBlock t0={splitT + 0.9} t1={b - 0.3} x={x0} y={by + bh + 40} />
      <Para t0={splitT + 1.4} t1={b - 0.3} y={1180} text={c.p1} color="#DCE8FF" size={46} />
      <Para t0={splitT + 2.8} t1={b - 0.3} y={1420} text={c.p2} color="#9FB6DC" size={40} />
    </>
  );
}
function Quarter({ i, l, x0, bw, gap, by, bh, a, splitT, b }) {
  const st = useTransform(T, (t) => {
    const e = ease(easeOutBack, (t - splitT) / 0.7);
    const x = x0 + i * bw + i * gap * e;
    const pop = t > splitT + i * 0.12 ? 1 + 0.07 * Math.sin(clamp((t - splitT - i * 0.12) / 0.4) * Math.PI) : 1;
    const enter = seg(t, a + 0.9, a + 1.5);
    return `translate(${x}px, ${by + (1 - enter) * 80}px) scale(${pop})`;
  });
  const o = useTransform(T, (t) => seg(t, a + 0.9, a + 1.4) * (1 - seg(t, b - 0.3, b + 0.1)));
  const fill = useTransform(T, (t) => (t < splitT ? NAVY : i === 3 ? TEAL : ACCENT));
  const lo = useTransform(T, (t) => seg(t, splitT + 0.2, splitT + 0.6));
  return (
    <motion.div style={{ position: "absolute", left: 0, top: 0, width: bw - 2, height: bh, borderRadius: 26, background: fill, transform: st, opacity: o,
      border: "3px solid rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <motion.div style={{ ...HL, fontSize: 64, color: WHITE, opacity: lo }}>{l}</motion.div>
      <motion.div style={{ ...BODY, fontSize: 28, color: "#EAF0FF", opacity: lo }}>update</motion.div>
    </motion.div>
  );
}
function FinalBlock({ t0, t1, x, y }) {
  return <R t0={t0} t1={t1} x={x} y={y} w={888} h={150} scaleIn dy={60}>
    <div style={{ width: 888, height: 150, borderRadius: 26, background: RED, display: "flex", alignItems: "center", justifyContent: "center", ...HL, fontSize: 56, color: WHITE }}>+ final declaration</div></R>;
}

// ----------------------------------------------------- slide 3: threshold stairs
function Stairs() {
  const c = C.stairs, a = S[2], b = S[3];
  const base = 1010, cw = 270, cg = 39, x0 = 84;
  const cols = c.steps; // [{when, amount, tag, h, color}]
  return (
    <>
      <Head t0={a + 0.5} t1={b - 0.3} y={190} text={c.title} color={INK} size={100} />
      {cols.map((s, i) => <Stair key={i} i={i} s={s} x={x0 + i * (cw + cg)} cw={cw} base={base} t0={a + 1.2 + i * 0.5} t1={b - 0.3} />)}
      <Meter t0={a + 3.9} t1={b - 0.3} y={1130} c={c.meter} />
      <Para t0={a + 5.6} t1={b - 0.3} y={1480} text={c.p1} color={MUTED} size={40} />
    </>
  );
}
function Stair({ i, s, x, cw, base, t0, t1 }) {
  const grow = useTransform(T, (t) => ease(bounce, (t - t0) / 0.8));
  const o = useTransform(T, (t) => (t < t0 ? 0 : 1 - seg(t, t1, t1 + 0.35, easeInCubic)));
  const hh = useTransform(grow, (g) => g * s.h);
  const ty = useTransform(grow, (g) => base - g * s.h);
  const lo = useTransform(T, (t) => seg(t, t0 + 0.5, t0 + 0.9));
  const pulse = useTransform(T, (t) => (s.hot && t > t0 + 1 ? 1 + 0.035 * Math.sin((t - t0) * 6) : 1));
  return (
    <motion.div style={{ position: "absolute", left: x, top: 0, width: cw, opacity: o, y: ty, scale: pulse }}>
      <motion.div style={{ height: hh, background: s.color, borderRadius: "22px 22px 0 0", position: "relative", overflow: "hidden" }}>
        <motion.div style={{ ...HL, fontSize: 52, color: WHITE, textAlign: "center", paddingTop: 22, opacity: lo }}>{s.amount}</motion.div>
        <motion.div style={{ ...BODY, fontWeight: 700, fontSize: 30, color: "#fff", textAlign: "center", marginTop: 8, opacity: lo }}>{s.tag}</motion.div>
      </motion.div>
      <motion.div style={{ ...HL, fontSize: 38, color: INK, textAlign: "center", marginTop: 16, opacity: lo }}>{s.when}</motion.div>
    </motion.div>
  );
}
function Meter({ t0, t1, y, c }) {
  const fill = useTransform(T, (t) => 0.29 + 0.71 * ease(easeOutCubic, (t - t0 - 1.1) / 1.6));
  const w = useTransform(fill, (f) => `${f * 100}%`);
  const num = useTransform(T, (t) => (t < t0 + 1.1 ? c.from : c.to));
  return (
    <R t0={t0} t1={t1} x={84} y={y} w={912} dy={30}>
      <div style={{ ...BODY, fontWeight: 600, fontSize: 38, color: MUTED }}>{c.label}</div>
      <div style={{ height: 40, borderRadius: 20, background: "#C9D6EA", marginTop: 18, overflow: "hidden" }}>
        <motion.div style={{ height: "100%", width: w, borderRadius: 20, background: `linear-gradient(90deg, ${ACCENT}, ${TEAL})` }} />
      </div>
      <motion.div style={{ ...HL, fontSize: 66, color: INK, marginTop: 14 }}>{num}</motion.div>
    </R>
  );
}

// ----------------------------------------------------- slide 4: bars vs threshold
function BarsSlide() {
  const c = C.bars, a = S[3], b = S[4];
  const base = 1260, k = 17; // px per £1k
  const lineY = base - 30 * k;
  return (
    <>
      <Head t0={a + 0.5} t1={b - 0.3} y={190} text={c.title} color={WHITE} size={92} />
      <Bar x={170} wd={300} v={34} k={k} base={base} t0={a + 1.6} t1={b - 0.3} color={ACCENT} label={c.b1} sub={c.b1sub} />
      <Bar x={610} wd={300} v={22} k={k} base={base} t0={a + 2.5} t1={b - 0.3} color="#5B7096" label={c.b2} sub={c.b2sub} />
      <Line y={lineY} t0={a + 3.6} t1={b - 0.3} label={c.line} />
      <Para t0={a + 5.0} t1={b - 0.3} y={1350} text={c.p1} color="#DCE8FF" size={44} />
      <Para t0={a + 6.6} t1={b - 0.3} y={1560} text={c.p2} color={TEAL} size={42} />
    </>
  );
}
function Bar({ x, wd, v, k, base, t0, t1, color, label, sub }) {
  const g = useTransform(T, (t) => ease(bounce, (t - t0) / 0.9));
  const hh = useTransform(g, (q) => q * v * k);
  const ty = useTransform(g, (q) => base - q * v * k);
  const o = useTransform(T, (t) => (t < t0 ? 0 : 1 - seg(t, t1, t1 + 0.35, easeInCubic)));
  const lo = useTransform(T, (t) => seg(t, t0 + 0.6, t0 + 1.0));
  return (
    <motion.div style={{ position: "absolute", left: x, top: 0, width: wd, y: ty, opacity: o }}>
      <motion.div style={{ ...HL, fontSize: 62, color: WHITE, textAlign: "center", position: "absolute", top: -78, width: wd, opacity: lo }}>{label}</motion.div>
      <motion.div style={{ height: hh, background: color, borderRadius: "20px 20px 0 0" }} />
      <motion.div style={{ ...BODY, fontWeight: 600, fontSize: 36, color: "#DCE8FF", textAlign: "center", position: "absolute", top: undefined, width: wd, opacity: lo }}>{null}</motion.div>
      <motion.div style={{ ...BODY, fontWeight: 600, fontSize: 36, color: "#DCE8FF", textAlign: "center", width: wd, marginTop: 14, opacity: lo }}>{sub}</motion.div>
    </motion.div>
  );
}
function Line({ y, t0, t1, label }) {
  const w = useTransform(T, (t) => `${ease(easeOutCubic, (t - t0) / 0.8) * 100}%`);
  const o = useTransform(T, (t) => (t < t0 ? 0 : 1 - seg(t, t1, t1 + 0.35, easeInCubic)));
  return (
    <motion.div style={{ position: "absolute", left: 64, right: 64, top: y, opacity: o }}>
      <motion.div style={{ height: 0, width: w, borderTop: `6px dashed ${RED}` }} />
      <div style={{ ...HL, fontSize: 34, color: RED, position: "absolute", right: 0, top: -48, background: NAVY, padding: "0 10px" }}>{label}</div>
    </motion.div>
  );
}

// ------------------------------------------------------------ slide 5: penalties
function Points() {
  const c = C.points, a = S[4], b = S[5];
  return (
    <>
      <Head t0={a + 0.5} t1={b - 0.3} y={190} text={c.title} color={INK} size={92} />
      <Panel x={84} t0={a + 1.5} t1={b - 0.3} c={c.p1} tone="calm" />
      <Panel x={560} t0={a + 2.6} t1={b - 0.3} c={c.p2} tone="alert" />
      <Para t0={a + 4.4} t1={b - 0.3} y={1130} text={c.t1} color={INK} size={44} />
      <Para t0={a + 5.9} t1={b - 0.3} y={1370} text={c.t2} color={MUTED} size={40} />
    </>
  );
}
function Panel({ x, t0, t1, c, tone }) {
  const alert = tone === "alert";
  return (
    <R t0={t0} t1={t1} x={x} y={520} w={436} h={500} scaleIn dy={70}>
      <div style={{ width: 436, height: 500, borderRadius: 34, background: alert ? NAVY : "#fff", border: alert ? "none" : "3px solid #C6D5EA", boxShadow: "0 18px 50px rgba(10,22,40,.16)", padding: 34, boxSizing: "border-box", position: "relative" }}>
        <div style={{ ...HL, fontSize: 56, color: alert ? WHITE : INK }}>{c.year}</div>
        <div style={{ ...BODY, fontWeight: 600, fontSize: 36, color: alert ? "#DCE8FF" : MUTED, marginTop: 8 }}>{c.sub}</div>
        <div style={{ display: "flex", gap: 14, marginTop: 56, flexWrap: "wrap" }}>
          {[0, 1, 2, 3].map((i) => <Dot key={i} i={i} t0={t0 + 0.9 + i * 0.35} alert={alert} />)}
        </div>
        <div style={{ ...HL, fontSize: 42, color: alert ? RED : TEAL, position: "absolute", left: 34, bottom: 34 }}>{c.tag}</div>
      </div>
    </R>
  );
}
function Dot({ i, t0, alert }) {
  const s = useTransform(T, (t) => Math.max(0.0001, ease(easeOutBack, (t - t0) / 0.4)));
  return <motion.div style={{ width: 76, height: 76, borderRadius: "50%", scale: s, background: alert ? RED : "#DCE6F4", border: alert ? "none" : "3px dashed #A9BBD4",
    color: WHITE, ...HL, fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>{alert ? "+1" : ""}</motion.div>;
}

// ----------------------------------------------------------------- slide 6: list
function ListSlide() {
  const c = C.list, a = S[5], b = S[6];
  return (
    <>
      <Head t0={a + 0.5} t1={b - 0.3} y={190} text={c.title} color={WHITE} size={100} />
      {c.items.map((it, i) => <Step key={i} i={i} it={it} t0={a + 1.6 + i * 1.5} t1={b - 0.3} />)}
      <Para t0={a + 6.4} t1={b - 0.3} y={1640} text={c.foot} color="#9FB6DC" size={34} />
    </>
  );
}
function Step({ i, it, t0, t1 }) {
  return (
    <R t0={t0} t1={t1} x={84} y={520 + i * 330} w={912} h={290} dy={70}>
      <div style={{ display: "flex", gap: 34, alignItems: "flex-start" }}>
        <div style={{ width: 120, height: 120, borderRadius: "50%", flex: "none", background: [ACCENT, TEAL, RED][i % 3], ...HL, fontSize: 70, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
        <div>
          <div style={{ ...HL, fontSize: 56, color: WHITE }}>{it.h}</div>
          <div style={{ ...BODY, fontSize: 40, color: "#C4D4EE", marginTop: 12 }}>{it.d}</div>
        </div>
      </div>
    </R>
  );
}

// ---------------------------------------------------------------------- app
function App() {
  const hookBg = useTransform(T, (t) => (t < S[1] ? "transparent" : NAVY));
  return (
    <div style={{ position: "relative", width: W, height: H, overflow: "hidden", background: "transparent" }}>
      <Wipe t0={S[1]} bg={NAVY} cx={540} cy={1000} />
      <Wipe t0={S[2]} bg={PAPER} cx={110} cy={1700} />
      <Wipe t0={S[3]} bg={NAVY} cx={980} cy={300} />
      <Wipe t0={S[4]} bg={PAPER} cx={540} cy={1900} />
      <Wipe t0={S[5]} bg={NAVY} cx={160} cy={160} />
      <Wipe t0={S[6]} grad={`radial-gradient(ellipse 90% 70% at 50% 40%, #123060 0%, ${NAVY} 70%)`} cx={540} cy={960} />
      <Logo t0={0.3} />
      <Hook />
      <Split />
      <Stairs />
      <BarsSlide />
      <Points />
      <ListSlide />
      <EndCard tLogo={S[6] + 0.8} tTag={S[6] + 1.8} tBtn={S[6] + 2.8} tUrl={S[6] + 3.6} tagline={C.end.tagline} cta={C.end.cta} />
      <Progress />
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
