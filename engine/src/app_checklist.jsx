







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
  const o = useTransform(T, (t) => seg(t, t0, t0 + 0.25));
  const y = useTransform(T, (t) => (1 - seg(t, t0, t0 + 0.55, easeOutBack)) * 90);
  const r = useTransform(T, (t) => (1 - seg(t, t0, t0 + 0.55, easeOutBack)) * -9);
  const sc = useTransform(T, (t) => 0.5 + 0.5 * seg(t, t0, t0 + 0.55, easeOutBack));
  return <motion.span style={{ display: "inline-block", opacity: o, y, rotate: r, scale: sc, marginRight: "0.26em", color }}>{children}</motion.span>;
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

function Logo({ t0 }) {
  const o = useTransform(T, (t) => seg(t, t0, t0 + 0.3));
  const sc = useTransform(T, (t) => seg(t, t0, t0 + 0.8, easeOutBack));
  const rot = useTransform(T, (t) => (1 - seg(t, t0, t0 + 0.9, easeOutBack)) * -220 + Math.sin(t * 2.2) * 4);
  const fy = useTransform(T, (t) => (t < t0 + 0.9 ? 0 : Math.sin(t * 2.6) * 6));
  return <motion.img src="brand/logo_small.png" style={{ position: "absolute", top: 64, left: 64, width: 96, opacity: o, scale: sc, rotate: rot, y: fy }} />;
}
function Progress() {
  const w = useTransform(T, (t) => `${clamp(t / END) * 100}%`);
  return <div style={{ position: "absolute", left: 64, right: 64, bottom: 60, height: 8, borderRadius: 4, background: "rgba(120,140,170,.28)" }}>
    <motion.div style={{ height: "100%", width: w, borderRadius: 4, background: `linear-gradient(90deg, ${ACCENT}, ${TEAL})` }} /></div>;
}


function Hook() {
  const h = C.hook, t0 = 0.2, t1 = S[1] - 0.1;
  const fade = useTransform(T, (t) => 1 - seg(t, t1, t1 + 0.35, easeInCubic));
  return (
    <>
      <R t0={0.2} t1={t1} x={84} y={190} w={912} dy={30}>
        <div style={{ ...HL, fontSize: 36, letterSpacing: "0.12em", color: TEAL, textTransform: "uppercase" }}>{h.kicker}</div>
      </R>
      <motion.div style={{ opacity: fade }}><CountUp text={h.big} t0={0.3} dur={1.3} style={{ position: "absolute", left: 84, top: 250, ...HL, fontSize: 150, color: INK }} /></motion.div>
      <Head t0={1.0} t1={t1} y={430} text={h.line} color={INK} size={58} step={0.09} />
      <HookScene />
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
  const o = useTransform(T, (t) => (t < t0 ? 0 : seg(t, t0, t0 + 0.3)) * (1 - seg(t, t1, t1 + 0.35, easeInCubic)));
  const cs = useTransform(T, (t) => seg(t, t0, t0 + 0.6, easeOutBack));
  const cr = useTransform(T, (t) => (1 - seg(t, t0, t0 + 0.7, easeOutBack)) * -200);
  const tx = useTransform(T, (t) => (1 - seg(t, t0 + 0.15, t0 + 0.75, easeOutBack)) * 180);
  const ty = useTransform(T, (t) => (t > t0 + 0.8 ? Math.sin(t * 3 + i) * 3 : 0));
  return (
    <motion.div style={{ position: "absolute", left: 84, top: 500 + i * 340, width: 912, height: 300, opacity: o, y: ty }}>
      <div style={{ display: "flex", gap: 34, alignItems: "flex-start" }}>
        <motion.div style={{ width: 120, height: 120, borderRadius: "50%", flex: "none", background: [ACCENT, TEAL, RED][i % 3], ...HL, fontSize: 70, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center", scale: cs, rotate: cr, boxShadow: "0 0 40px rgba(46,124,246,.5)" }}>{n}</motion.div>
        <motion.div style={{ x: tx }}>
          <div style={{ ...HL, fontSize: 54, color: WHITE }}>{it.h}</div>
          <div style={{ ...BODY, fontSize: 38, color: "#C4D4EE", marginTop: 12 }}>{it.d}</div>
        </motion.div>
      </div>
    </motion.div>
  );
}
function StatSlide() {
  const c = C.stat, a = S[2], b = S[3];
  const b0 = c.barStart ?? 0.2, b1 = c.barEnd ?? 1;
  const fill = useTransform(T, (t) => b0 + (b1 - b0) * ease(easeOutCubic, (t - a - 2.6) / 1.8));
  const w = useTransform(fill, (f) => `${f * 100}%`);
  const num = useTransform(T, (t) => (t < a + 2.6 ? c.from : c.to));
  return (
    <>
      <Head t0={a + 0.5} t1={b - 0.3} y={190} text={c.title} color={INK} size={92} />
      <R t0={a + 1.2} t1={b - 0.3} x={84} y={520} w={912} h={560} scaleIn dy={60}>
        <div style={{ width: 912, height: 520, borderRadius: 34, background: "#fff", border: "3px solid #C6D5EA", boxShadow: "0 18px 50px rgba(10,22,40,.16)", padding: 48, boxSizing: "border-box" }}>
          <CountUp text={c.big} t0={a + 1.5} dur={1.2} style={{ ...HL, fontSize: 150, color: INK, letterSpacing: "-0.03em" }} />
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

const parseNum = (str) => { const m = String(str).match(/^([\d.,]+)(.*)$/); if (!m) return null; const raw = m[1].replace(/,/g, ""); return { v: parseFloat(raw), d: (raw.split(".")[1] || "").length, rest: m[2], comma: m[1].includes(",") }; };
function CountUp({ text, t0, dur = 1.2, style }) {
  const n = parseNum(text);
  const txt = useTransform(T, (t) => { if (!n) return text; const k = seg(t, t0, t0 + dur); const v = n.v * k; return (n.comma ? Math.round(v).toLocaleString("en-GB") : v.toFixed(n.d)) + n.rest; });
  const sc = useTransform(T, (t) => 0.6 + 0.4 * seg(t, t0, t0 + 0.7, easeOutBack) + 0.06 * Math.max(0, 1 - Math.abs(t - (t0 + dur)) * 5) * (t > t0 + dur - 0.2 ? 1 : 0));
  const o = useTransform(T, (t) => seg(t, t0, t0 + 0.2));
  return <motion.div style={{ ...style, scale: sc, opacity: o, transformOrigin: "0 60%" }}>{txt}</motion.div>;
}

function Shop({ main = "#2E7CF6", alt = "#34D3A6", door = "#34D3A6", body = "#1C4FB8", face = false }) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      {[0,1,2,3,4].map((i) => <rect key={i} x={8 + i * 16.8} y={16} width={16.8} height={26} fill={i % 2 ? alt : main} />)}
      <path d="M8 42 q8.4 10 16.8 0 q8.4 10 16.8 0 q8.4 10 16.8 0 q8.4 10 16.8 0 q8.4 10 16.8 0 Z" fill={main} />
      <rect x={14} y={46} width={72} height={42} rx={3} fill={body} />
      <rect x={22} y={56} width={28} height={20} rx={3} fill={alt} opacity={0.9} />
      <rect x={60} y={54} width={16} height={34} rx={2} fill={door} />
      {face && <path d="M32 68 q6 6 12 0" stroke="#0A1628" strokeWidth={2.4} fill="none" strokeLinecap="round" />}
    </svg>
  );
}
const GREY = { main: "#C4CBE0", alt: "#D4DAEA", door: "#C4CBE0", body: "#D9DFEE" };

function Pop({ t0, t1, x, y, w, h, from = "scale", children, rot = 0, floatAmp = 0, floatSpd = 2, dropFrom = 0 }) {
  const o = useTransform(T, (t) => (t < t0 ? 0 : 1) * (1 - seg(t, t1, t1 + 0.35, easeInCubic)));
  const sc = useTransform(T, (t) => (from === "scale" ? seg(t, t0, t0 + 0.6, easeOutBack) : 1) * (1 - 0.3 * seg(t, t1, t1 + 0.35, easeInCubic)));
  const yy = useTransform(T, (t) => { const k = Math.min(1, Math.max(0, (t - t0) / 0.7)); const drop = dropFrom ? -dropFrom * (1 - (k < 1 ? bounce(k) : 1)) : 0; return drop + (t > t0 + 0.7 ? Math.sin(t * floatSpd + x) * floatAmp : 0); });
  const rr = useTransform(T, (t) => rot * (1 - seg(t, t0, t0 + 0.7, easeOutBack)));
  return <motion.div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: o, scale: sc, y: yy, rotate: rr }}>{children}</motion.div>;
}

function HookScene() {
  const end = S[1] - 0.1;
  return (
    <>
      <Pop t0={0.7} t1={end} x={90} y={820} w={330} h={600} dropFrom={900} floatAmp={9} floatSpd={2.4}>
        <div style={{ width: "100%", height: "100%", borderRadius: 54, background: NAVY, padding: 16, boxSizing: "border-box", boxShadow: "0 30px 60px rgba(10,22,40,.25)" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 40, background: "linear-gradient(180deg,#2E7CF6,#1C4FB8)" }} />
        </div>
      </Pop>
      <Pop t0={1.5} t1={end} x={290} y={960} w={290} h={250} floatAmp={8} floatSpd={3}>
        <div style={{ width: "100%", height: "100%", borderRadius: 40, background: TEAL, padding: 40, boxSizing: "border-box", boxShadow: "0 0 70px rgba(52,211,166,.7), 0 20px 40px rgba(10,22,40,.2)" }}><Shop face main="#2E7CF6" alt="#0A1628" door="#0A1628" body="#EAF0F9" /></div>
      </Pop>
      <Pop t0={2.0} t1={end} x={375} y={800} w={110} h={150} dropFrom={500} floatAmp={7} floatSpd={4}>
        <svg viewBox="0 0 60 80" width="100%" height="100%"><path d="M30 78 C30 78 4 48 4 28 A26 26 0 1 1 56 28 C56 48 30 78 30 78Z" fill={TEAL} stroke="#0A1628" strokeWidth={3} /><circle cx={30} cy={28} r={10} fill="#fff" /></svg>
      </Pop>
      {[0,1,2,3].map((i) => (
        <Pop key={i} t0={2.9 + i * 0.28} t1={end} x={620 + i * 100} y={1160 + (i % 2) * 40} w={92} h={92} dropFrom={260} rot={i % 2 ? 14 : -14} floatAmp={5} floatSpd={2 + i * 0.4}>
          <Shop {...GREY} />
        </Pop>
      ))}
      {[[330,780,0],[520,840,1],[470,1180,2]].map(([sx,sy,i]) => <Spark key={i} x={sx} y={sy} t0={2.2 + i * 0.18} t1={end} />)}
    </>
  );
}
function Spark({ x, y, t0, t1 }) {
  const sc = useTransform(T, (t) => { const k = (t - t0) / 0.9; return k < 0 || k > 1 ? 0 : Math.sin(k * Math.PI) * 1.1; });
  const r = useTransform(T, (t) => (t - t0) * 140);
  return <motion.div style={{ position: "absolute", left: x, top: y, width: 60, height: 60, scale: sc, rotate: r }}>
    <svg viewBox="0 0 60 60"><path d="M30 0 L36 24 L60 30 L36 36 L30 60 L24 36 L0 30 L24 24 Z" fill={TEAL} /></svg></motion.div>;
}

const MPOS = [[760, 1450], [770, 1470], [770, 1520], [770, 1300]]; // hook, listA, stat, listB
function Mascot() {
  const slide = (t) => { let i = 0; for (let k = 0; k < MPOS.length; k++) if (t >= S[k] + 0.2) i = k; return i; };
  const pos = (t) => {
    const i = slide(t); const cur = MPOS[i]; const prev = MPOS[Math.max(0, i - 1)];
    const p = i === 0 ? 1 : seg(t, S[i] + 0.2, S[i] + 1.0, easeOutCubic);
    const arc = i === 0 ? 0 : Math.sin(p * Math.PI) * 220;
    return { x: prev[0] + (cur[0] - prev[0]) * p, y: prev[1] + (cur[1] - prev[1]) * p - arc, i };
  };
  const tx = useTransform(T, (t) => pos(t).x);
  const ty = useTransform(T, (t) => pos(t).y + Math.sin(t * 5) * 6 + (t < 1.9 ? (1 - bounce(Math.min(1, Math.max(0, (t - 0.9) / 1.0)))) * -700 : 0));
  const sc = useTransform(T, (t) => seg(t, 0.9, 1.6, easeOutBack) * (1 - seg(t, S[4] - 0.4, S[4] + 0.2, easeInCubic)));
  const tilt = useTransform(T, (t) => Math.sin(t * 3.2) * 4);
  const arm = (side) => useTransform(T, (t) => {
    const i = slide(t); const w = Math.sin(t * 9);
    let a;
    if (i === 0) a = side === "r" ? -140 + w * 22 : 8;
    else if (i === 1) a = side === "r" ? 98 + Math.sin(t * 4) * 8 : 6;
    else if (i === 2) a = side === "r" ? -62 + Math.sin(t * 5) * 8 : 62 - Math.sin(t * 5) * 8;
    else a = side === "r" ? -150 + w * 16 : 150 - w * 16;
    return `rotate(${a} ${side === "r" ? 142 : 58} 168)`;
  });
  const blink = useTransform(T, (t) => (t % 3.1 < 0.12 ? 0.1 : 1));
  const eyeT = useTransform(blink, (b) => `translate(0 95) scale(1 ${b}) translate(0 -95)`);
  return (
    <motion.div style={{ position: "absolute", left: 0, top: 0, width: 240, height: 312, x: tx, y: ty, scale: sc, rotate: tilt, transformOrigin: "50% 100%" }}>
      <svg viewBox="0 0 200 260" width="100%" height="100%">
        <line x1={100} y1={22} x2={100} y2={52} stroke="#0A1628" strokeWidth={6} />
        <circle cx={100} cy={16} r={11} fill={TEAL} /><circle cx={100} cy={16} r={18} fill={TEAL} opacity={0.25} />
        <motion.g transform={arm("l")}><rect x={44} y={160} width={16} height={62} rx={8} fill={TEAL} stroke="#0A1628" strokeWidth={3} /></motion.g>
        <motion.g transform={arm("r")}><rect x={140} y={160} width={16} height={62} rx={8} fill={TEAL} stroke="#0A1628" strokeWidth={3} /></motion.g>
        <rect x={58} y={146} width={84} height={80} rx={22} fill={ACCENT} stroke="#0A1628" strokeWidth={5} />
        <rect x={78} y={164} width={44} height={30} rx={8} fill="#0A1628" /><circle cx={92} cy={179} r={5} fill={TEAL} /><circle cx={108} cy={179} r={5} fill={RED} />
        <rect x={66} y={226} width={26} height={22} rx={8} fill={TEAL} stroke="#0A1628" strokeWidth={3} /><rect x={108} y={226} width={26} height={22} rx={8} fill={TEAL} stroke="#0A1628" strokeWidth={3} />
        <rect x={40} y={50} width={120} height={90} rx={28} fill={ACCENT} stroke="#0A1628" strokeWidth={5} />
        <rect x={56} y={66} width={88} height={58} rx={18} fill="#0A1628" />
        <motion.g transform={eyeT}><circle cx={82} cy={95} r={9} fill={TEAL} /><circle cx={118} cy={95} r={9} fill={TEAL} /></motion.g>
        <path d="M86 112 Q100 124 114 112" stroke={TEAL} strokeWidth={5} fill="none" strokeLinecap="round" />
      </svg>
    </motion.div>
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
      <Mascot />
      <Progress />
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
