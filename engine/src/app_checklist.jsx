







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


function Hook() {
  const h = C.hook, t0 = 0.2, t1 = S[1] - 0.1;
  const big = useTransform(T, (t) => 0.9 + 0.1 * seg(t, 0.2, 0.9, easeOutBack));
  return (
    <>
      <R t0={0.2} t1={t1} x={84} y={190} w={912} dy={30}>
        <div style={{ ...HL, fontSize: 36, letterSpacing: "0.12em", color: TEAL, textTransform: "uppercase" }}>{h.kicker}</div>
      </R>
      <motion.div style={{ position: "absolute", left: 84, top: 250, width: 912, ...HL, fontSize: 104, color: INK, scale: big, transformOrigin: "0 50%",
        opacity: useTransform(T, (t) => seg(t, 0.2, 0.7) * (1 - seg(t, t1, t1 + 0.35, easeInCubic))) }}>{h.big}</motion.div>
      <Head t0={0.9} t1={t1} y={380} text={h.line} color={INK} size={54} step={0.07} />
    </>
  );
}

// ---- checklist variant: hook, 3-step list, stat card, 3-step list, end ----
function ListA() {
  const c = C.listA, a = S[1], b = S[2];
  return (
    <>
      <Head t0={a + 0.5} t1={b - 0.3} y={190} text={c.title} color={WHITE} size={100} />
      {c.items.map((it, i) => <Step key={i} i={i} it={it} n={c.start + i} t0={a + 1.8 + i * 2.6} t1={b - 0.3} />)}
    </>
  );
}
function ListB() {
  const c = C.listB, a = S[3], b = S[4];
  return (
    <>
      <Head t0={a + 0.5} t1={b - 0.3} y={190} text={c.title} color={WHITE} size={100} />
      {c.items.map((it, i) => <Step key={i} i={i} it={it} n={c.start + i} t0={a + 1.8 + i * 2.6} t1={b - 0.3} />)}
      <Para t0={a + 9.0} t1={b - 0.3} y={1640} text={c.foot} color="#9FB6DC" size={34} />
    </>
  );
}
function Step({ i, it, n, t0, t1 }) {
  return (
    <R t0={t0} t1={t1} x={84} y={500 + i * 340} w={912} h={300} dy={70}>
      <div style={{ display: "flex", gap: 34, alignItems: "flex-start" }}>
        <div style={{ width: 120, height: 120, borderRadius: "50%", flex: "none", background: [ACCENT, TEAL, RED][i % 3], ...HL, fontSize: 70, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</div>
        <div>
          <div style={{ ...HL, fontSize: 54, color: WHITE }}>{it.h}</div>
          <div style={{ ...BODY, fontSize: 38, color: "#C4D4EE", marginTop: 12 }}>{it.d}</div>
        </div>
      </div>
    </R>
  );
}
function StatSlide() {
  const c = C.stat, a = S[2], b = S[3];
  const fill = useTransform(T, (t) => 0.2 + 0.8 * ease(easeOutCubic, (t - a - 2.6) / 1.8));
  const w = useTransform(fill, (f) => `${f * 100}%`);
  const num = useTransform(T, (t) => (t < a + 2.6 ? c.from : c.to));
  return (
    <>
      <Head t0={a + 0.5} t1={b - 0.3} y={190} text={c.title} color={INK} size={92} />
      <R t0={a + 1.2} t1={b - 0.3} x={84} y={520} w={912} h={560} scaleIn dy={60}>
        <div style={{ width: 912, height: 520, borderRadius: 34, background: "#fff", border: "3px solid #C6D5EA", boxShadow: "0 18px 50px rgba(10,22,40,.16)", padding: 48, boxSizing: "border-box" }}>
          <div style={{ ...HL, fontSize: 150, color: INK, letterSpacing: "-0.03em" }}>{c.big}</div>
          <div style={{ ...BODY, fontWeight: 600, fontSize: 40, color: MUTED, marginTop: 6 }}>{c.sub}</div>
          <div style={{ height: 40, borderRadius: 20, background: "#C9D6EA", marginTop: 44, overflow: "hidden" }}>
            <motion.div style={{ height: "100%", width: w, borderRadius: 20, background: `linear-gradient(90deg, ${ACCENT}, ${RED})` }} />
          </div>
          <motion.div style={{ ...HL, fontSize: 52, color: INK, marginTop: 20 }}>{num}</motion.div>
        </div>
      </R>
      <Para t0={a + 4.4} t1={b - 0.3} y={1180} text={c.p1} color={INK} size={46} />
      <Para t0={a + 5.8} t1={b - 0.3} y={1400} text={c.p2} color={MUTED} size={40} />
    </>
  );
}

function App() {
  return (
    <div style={{ position: "relative", width: W, height: H, overflow: "hidden", background: "transparent" }}>
      <Wipe t0={S[1]} bg={NAVY} cx={540} cy={1000} />
      <Wipe t0={S[2]} bg={PAPER} cx={110} cy={1700} />
      <Wipe t0={S[3]} bg={NAVY} cx={980} cy={300} />
      <Wipe t0={S[4]} grad={`radial-gradient(ellipse 90% 70% at 50% 40%, #123060 0%, ${NAVY} 70%)`} cx={540} cy={960} />
      <Logo t0={0.3} />
      <Hook />
      <ListA />
      <StatSlide />
      <ListB />
      <EndCard tLogo={S[4] + 0.6} tTag={S[4] + 1.4} tBtn={S[4] + 2.2} tUrl={S[4] + 2.9} tagline={C.end.tagline} cta={C.end.cta} />
      <Progress />
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
