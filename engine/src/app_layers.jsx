// Kaizen layered animation base. Takes the day's illustration split into
// separate cut-out elements (generated as individual images) and animates
// them with Framer Motion keyframes: springs, squash and stretch, flying
// props, drawn rings and ticks, particle bursts. No generated video, no
// credits, the same elements move the same way every render. The result is an
// opaque base clip that render_hybrid.sh puts the typography over.
//
// Config (window.__CONFIG): { bg, floorY, actors: [...], fx: [...] }
//   actor: { src, x, y, w, origin: "bottom"|"center", keys: [{t,x,y,s,r,o,sx,sy,e}], idle: {...} }
//   keys interpolate numerically; e on a key is the ease INTO that key:
//   "out" (default), "back", "bounce", "inout", "linear".
//   idle: { bob: amp, bobHz, sway: deg, swayHz, breathe: amp, from: seconds }
//   fx: { type: "ring"|"tick"|"burst"|"bang", ... }
import React from "react";
import { createRoot } from "react-dom/client";
import { motion, useTransform } from "framer-motion";
import { T } from "./shared";

const C = window.__CONFIG;
const W = 1080, H = 1920;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const EASE = {
  out: (p) => 1 - Math.pow(1 - p, 3),
  inout: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  linear: (p) => p,
  back: (p) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  bounce: (p) => {
    const n = 7.5625, d = 2.75;
    if (p < 1 / d) return n * p * p;
    if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75;
    if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375;
    return n * (p -= 2.625 / d) * p + 0.984375;
  },
};
const DEF = { x: 0, y: 0, s: 1, r: 0, o: 1, sx: 1, sy: 1 };

function sample(keys, t) {
  if (!keys || !keys.length) return { ...DEF };
  const first = { ...DEF, ...keys[0] };
  if (t <= keys[0].t) return first;
  let prev = first;
  for (let i = 1; i < keys.length; i++) {
    const k = { ...prev, ...keys[i] };
    keys[i]._m = k; // merged, carries unspecified props forward
    if (t <= k.t) {
      const p = (t - prev.t) / Math.max(1e-6, k.t - prev.t);
      const e = (EASE[keys[i].e || "out"] || EASE.out)(clamp01(p));
      const out = {};
      for (const key of Object.keys(DEF)) out[key] = prev[key] + (k[key] - prev[key]) * e;
      return out;
    }
    prev = k;
  }
  return prev;
}

function Actor({ a }) {
  const st = useTransform(T, (t) => {
    const v = sample(a.keys, t);
    const id = a.idle || {};
    const ti = Math.max(0, t - (id.from || 0));
    const on = t >= (id.from || 0) ? 1 : 0;
    const bob = on * (id.bob || 0) * Math.sin(ti * (id.bobHz || 0.7) * Math.PI * 2);
    const sway = on * (id.sway || 0) * Math.sin(ti * (id.swayHz || 0.5) * Math.PI * 2);
    const br = on * (id.breathe || 0) * Math.sin(ti * (id.breatheHz || 1.1) * Math.PI * 2);
    const sx = v.s * v.sx * (1 - br), sy = v.s * v.sy * (1 + br);
    return `translate(${v.x}px, ${v.y + bob}px) rotate(${v.r + sway}deg) scale(${sx}, ${sy})`;
  });
  const op = useTransform(T, (t) => sample(a.keys, t).o);
  const bottom = a.origin === "bottom";
  const h = a.w * (a.ar || 1);
  return (
    <motion.img
      src={a.src}
      style={{
        position: "absolute", left: a.x - a.w / 2, top: bottom ? a.y - h : a.y - h / 2,
        width: a.w, height: h, transformOrigin: bottom ? "50% 100%" : "50% 50%",
        transform: st, opacity: op, willChange: "transform",
      }}
    />
  );
}

function Ring({ f }) {
  const len = 2 * Math.PI * f.r;
  const d = useTransform(T, (t) => len * (1 - clamp01((t - f.t0) / (f.dur || 0.7))));
  const pulse = useTransform(T, (t) => {
    const on = f.pulseFrom != null && t > f.pulseFrom ? 1 : 0;
    return 1 + on * 0.12 * Math.sin((t - f.pulseFrom) * 7);
  });
  const o = useTransform(T, (t) => (t >= f.t0 && t < (f.tOut || 999) ? 1 : 0));
  return (
    <motion.svg width={f.r * 2 + 40} height={f.r * 2 + 40} viewBox={`${-f.r - 20} ${-f.r - 20} ${f.r * 2 + 40} ${f.r * 2 + 40}`}
      style={{ position: "absolute", left: f.x - f.r - 20, top: f.y - f.r - 20, opacity: o, scale: pulse, overflow: "visible" }}>
      <motion.circle r={f.r} fill="none" stroke={f.color || "#2E7CF6"} strokeWidth={f.sw || 9} strokeLinecap="round"
        strokeDasharray={len} style={{ strokeDashoffset: d }} transform="rotate(-100)" />
    </motion.svg>
  );
}

function Tick({ f }) {
  const s = useTransform(T, (t) => Math.max(0.0001, EASE.back(clamp01((t - f.t0) / 0.45))));
  const o = useTransform(T, (t) => (t >= f.t0 ? 1 : 0));
  return (
    <motion.div style={{ position: "absolute", left: f.x - f.r, top: f.y - f.r, width: f.r * 2, height: f.r * 2, scale: s, opacity: o }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <circle cx="50" cy="50" r="48" fill={f.color || "#34D3A6"} />
        <path d="M27 52 L44 68 L74 34" fill="none" stroke="#fff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  );
}

function Bang({ f }) {
  const s = useTransform(T, (t) => Math.max(0.0001, EASE.back(clamp01((t - f.t0) / 0.3))) * (1 + 0.08 * Math.sin((t - f.t0) * 22)));
  const o = useTransform(T, (t) => (t >= f.t0 && t < f.t1 ? 1 : 0));
  return (
    <motion.div style={{ position: "absolute", left: f.x - f.r, top: f.y - f.r, width: f.r * 2, height: f.r * 2, scale: s, opacity: o, rotate: -8 }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <circle cx="50" cy="50" r="48" fill={f.color || "#FF5A5F"} />
        <rect x="44" y="20" width="12" height="38" rx="6" fill="#fff" />
        <circle cx="50" cy="75" r="7.5" fill="#fff" />
      </svg>
    </motion.div>
  );
}

// deterministic pseudo random
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

function Burst({ f }) {
  const n = f.n || 18;
  const cols = f.colors || ["#2E7CF6", "#34D3A6", "#0A1628", "#FFFFFF"];
  return (
    <>
      {Array.from({ length: n }).map((_, i) => <Particle key={i} i={i} f={f} col={cols[i % cols.length]} />)}
    </>
  );
}
function Particle({ i, f, col }) {
  const ang = (i / (f.n || 18)) * Math.PI * 2 + rnd(i, 1) * 0.5;
  const sp = 220 + rnd(i, 2) * 260;
  const sz = 14 + rnd(i, 3) * 18;
  const st = useTransform(T, (t) => {
    const p = t - f.t0;
    if (p < 0 || p > 1.4) return "translate(-999px,-999px)";
    const e = EASE.out(clamp01(p / 1.1));
    const x = f.x + Math.cos(ang) * sp * e;
    const y = f.y + Math.sin(ang) * sp * e + 260 * p * p * 0.6;
    return `translate(${x}px, ${y}px) rotate(${p * 420 * (rnd(i, 4) - 0.5)}deg) scale(${1 - clamp01((p - 0.7) / 0.7)})`;
  });
  return <motion.div style={{ position: "absolute", left: 0, top: 0, width: sz, height: sz, borderRadius: i % 3 === 0 ? "50%" : 4, background: col, transform: st }} />;
}

function Shadow({ s }) {
  const st = useTransform(T, (t) => {
    const v = sample(s.keys, t);
    const lift = Math.max(0, (s.baseY - (v.y + (s.follow || 0))) * 0.0);
    return `scale(${v.s * v.sx * (s.k || 1)}, ${v.s * v.sy * 0.4})`;
  });
  const op = useTransform(T, (t) => sample(s.keys, t).o * 0.18);
  return <motion.div style={{ position: "absolute", left: s.x - s.w / 2, top: s.y - s.w * 0.1, width: s.w, height: s.w * 0.2, borderRadius: "50%", background: "#0A1628", transform: st, opacity: op }} />;
}

function App() {
  const fx = C.fx || [];
  return (
    <div style={{ position: "relative", width: W, height: H, background: C.bg || "#E7EEF8", overflow: "hidden" }}>
      {(C.shadows || []).map((s, i) => <Shadow key={"s" + i} s={s} />)}
      {(C.actors || []).map((a, i) => <Actor key={i} a={a} />)}
      {fx.map((f, i) => f.type === "ring" ? <Ring key={i} f={f} /> : f.type === "tick" ? <Tick key={i} f={f} /> : f.type === "bang" ? <Bang key={i} f={f} /> : <Burst key={i} f={f} />)}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
