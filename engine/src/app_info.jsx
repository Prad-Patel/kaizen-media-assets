// Kaizen daily social video - animated infographic.
//
// The same flat-vector infographic look Kaizen already uses on its posts, but
// drawn as real vector art and animated, rather than generated as a picture.
// Every glyph is real typography rendered by Framer Motion, so nothing is ever
// distorted or misspelled the way AI-painted lettering is.
//
// Light paper background, navy ink, electric blue and teal accents. The scene
// is a generic "the tools you use, and the engine underneath" diagram: a
// monitor running everyday software, an engine bay under it where the model is
// swapped out, and dashed leader lines running to the three points.
import React from "react";
import { createRoot } from "react-dom/client";
import { motion, useTransform } from "framer-motion";
import { T, seg, easeOutBack, easeOutCubic, easeInCubic, ACCENT, TEAL, RED, EndCard } from "./shared";

const C = window.__CONFIG;
const W = 1080, CH = 1920;

// light-mode palette
const PAPER = "#EAF0F9";
const PAPER2 = "#DBE5F4";
const INK = "#0E2038";
const MUTED = "#4E6485";
const EDGE = "#C6D5EA";
const CARD = "#FFFFFF";
const NAVY = "#0A1628";
const GREY = "#A9BBD4";

// type
const HL = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: INK, lineHeight: 1.04, letterSpacing: "-0.02em" };
const BODY = { fontFamily: "'Inter', sans-serif", fontWeight: 600, color: INK, lineHeight: 1.22 };

// timeline
const P0 = 4.5, PGAP = 3.0;
const T_CLEAR = 13.15;
const T_STAT = 13.6;
const T_SWEEP = 17.35;

// scene geometry
const MON = { x: 250, y: 520, w: 580, h: 400 };
const BAY = { x: 250, y: 1030, w: 580, h: 190 };
const HUB = { cx: 540, cy: 1125, r: 66 };
const SAT = [{ cx: 440, cy: 1089, r: 40, dir: -1 }, { cx: 640, cy: 1089, r: 40, dir: -1 }];
const ROWS = [1305, 1470, 1635];
const RAIL = 96;
const ANCHOR = [[BAY.x, 1125], [MON.x, 720], [BAY.x, 1195]];
const DOTC = [ACCENT, TEAL, ACCENT];

// ---------------------------------------------------------------- primitives

function gearPath(cx, cy, r, teeth) {
  const rt = r, rr = r * 0.79;
  const step = (Math.PI * 2) / teeth;
  const at = [[rr, 0.0], [rt, 0.15], [rt, 0.35], [rr, 0.5], [rr, 0.66], [rr, 0.83]];
  let d = "";
  for (let i = 0; i < teeth; i++) {
    for (const [rad, f] of at) {
      const a = (i + f) * step;
      const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
      d += (d ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2) + " ";
    }
  }
  return d + "Z";
}

// Gears are HTML layers rather than SVG groups. CSS transforms on plain divs
// are exact and need no bounding-box measurement, so rotation is frame-stable.
function Gear({ cx, cy, r, teeth = 14, color, speed = 22, dir = 1, tIn = 0, tOut, lift = 0, rise = 0, hole = CARD }) {
  const S = r * 2;
  const rot = useTransform(T, (t) => (t - tIn) * speed * dir);
  const o = useTransform(T, (t) => seg(t, tIn, tIn + 0.45) * (tOut != null ? 1 - seg(t, tOut + 0.3, tOut + 0.95) : 1));
  const dy = useTransform(T, (t) => {
    const up = tOut != null ? -seg(t, tOut, tOut + 0.95, easeOutCubic) * lift : 0;
    const inn = rise ? (1 - seg(t, tIn, tIn + 0.9, easeOutCubic)) * rise : 0;
    return up + inn;
  });
  return (
    <motion.div style={{ position: "absolute", left: cx - r, top: cy - r, width: S, height: S, opacity: o, y: dy }}>
      <motion.div style={{ width: S, height: S, rotate: rot }}>
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
          <path d={gearPath(r, r, r, teeth)} fill={color} />
          <circle cx={r} cy={r} r={r * 0.3} fill={hole} />
          <circle cx={r} cy={r} r={r * 0.13} fill={color} />
        </svg>
      </motion.div>
    </motion.div>
  );
}

// dashed leader that grows from (x1,y1) to (x2,y2)
function Leader({ x1, y1, x2, y2, t0, dur = 0.5, color = "#9FB4D2" }) {
  const p = useTransform(T, (t) => seg(t, t0, t0 + dur));
  const X = useTransform(p, (v) => x1 + (x2 - x1) * v);
  const Y = useTransform(p, (v) => y1 + (y2 - y1) * v);
  const o = useTransform(T, (t) => seg(t, t0, t0 + 0.12));
  return <motion.line x1={x1} y1={y1} x2={X} y2={Y} stroke={color} strokeWidth={3} strokeDasharray="11 11" strokeLinecap="round" style={{ opacity: o }} />;
}

// An empty node waits on the rail from the start, then fills when its point
// lands - the way a printed infographic shows you where it is going.
function Dot({ x, y, t0, color }) {
  const r = useTransform(T, (t) => 15 * seg(t, t0, t0 + 0.38, easeOutBack));
  const ro = useTransform(T, (t) => 15 + 24 * seg(t, t0, t0 + 0.7));
  const oo = useTransform(T, (t) => 0.55 * seg(t, t0, t0 + 0.06) * (1 - seg(t, t0 + 0.1, t0 + 0.7)));
  const wait = useTransform(T, (t) => 0.45 * seg(t, 1.4, 2.1) * (1 - seg(t, t0, t0 + 0.3)));
  return (
    <g>
      <motion.circle cx={x} cy={y} r={15} fill="none" stroke="#A9BBD4" strokeWidth={3} style={{ opacity: wait }} />
      <motion.circle cx={x} cy={y} r={ro} fill="none" stroke={color} strokeWidth={3} style={{ opacity: oo }} />
      <motion.circle cx={x} cy={y} r={r} fill={color} />
    </g>
  );
}

function Rail() {
  const o = useTransform(T, (t) => 0.4 * seg(t, 1.5, 2.2) * (1 - seg(t, P0 + 0.2, P0 + 0.7)));
  return <motion.line x1={RAIL} y1={ROWS[0]} x2={RAIL} y2={ROWS[ROWS.length - 1]} stroke="#B4C6DE" strokeWidth={2} strokeDasharray="8 11" style={{ opacity: o }} />;
}

// word-by-word reveal, no shadows (flat light design)
function Word({ t0, children, style = {}, dur = 0.34 }) {
  const o = useTransform(T, (t) => seg(t, t0, t0 + dur));
  const y = useTransform(T, (t) => (1 - seg(t, t0, t0 + dur)) * 34);
  return <motion.span style={{ display: "inline-block", opacity: o, y, marginRight: "0.26em", ...style }}>{children}</motion.span>;
}

// everything on the paper layer lifts away together before the stat
function Paper({ children }) {
  const o = useTransform(T, (t) => 1 - seg(t, T_CLEAR, T_CLEAR + 0.4, easeInCubic));
  const y = useTransform(T, (t) => -seg(t, T_CLEAR, T_CLEAR + 0.4) * 70);
  return <motion.div style={{ position: "absolute", inset: 0, opacity: o, y }}>{children}</motion.div>;
}

// ------------------------------------------------------------------- backdrop

function Backdrop() {
  const o = useTransform(T, (t) => 1 - seg(t, T_SWEEP, T_SWEEP + 0.5));
  return (
    <motion.div style={{ position: "absolute", inset: 0, background: PAPER, opacity: o }}>
      <svg width={W} height={CH} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="dots" width="46" height="46" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" fill={PAPER2} />
          </pattern>
          <radialGradient id="glowA" cx="50%" cy="50%">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.16" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glowB" cx="50%" cy="50%">
            <stop offset="0%" stopColor={TEAL} stopOpacity="0.16" />
            <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={CH} fill="url(#dots)" />
        <circle cx={880} cy={430} r={460} fill="url(#glowA)" />
        <circle cx={160} cy={1420} r={470} fill="url(#glowB)" />
      </svg>
    </motion.div>
  );
}

// ---------------------------------------------------------------------- scene

function Screen() {
  // the everyday software panels light up on point 2
  const t2 = P0 + PGAP + 0.9;
  const lit = useTransform(T, (t) => seg(t, t2, t2 + 0.6));
  const rows = [];
  for (let i = 0; i < 6; i++) rows.push(i);
  return (
    <g>
      {/* monitor shell */}
      <rect x={MON.x} y={MON.y} width={MON.w} height={MON.h} rx={26} fill={CARD} stroke={EDGE} strokeWidth={4} />
      <path d={`M${MON.x} ${MON.y + 26} a26 26 0 0 1 26 -26 h${MON.w - 52} a26 26 0 0 1 26 26 v34 h${-MON.w} z`} fill="#F2F6FD" />
      {[0, 1, 2].map((i) => <circle key={i} cx={MON.x + 34 + i * 26} cy={MON.y + 30} r={7} fill={i === 0 ? "#E4B7B9" : i === 1 ? "#E8D6AE" : "#B9DCC6"} />)}

      {/* left panel - a spreadsheet */}
      <rect x={MON.x + 34} y={MON.y + 92} width={244} height={268} rx={14} fill="#F7FAFE" stroke={EDGE} strokeWidth={3} />
      <rect x={MON.x + 34} y={MON.y + 92} width={244} height={40} rx={14} fill="#E6EEFA" />
      {rows.map((i) => (
        <g key={i}>
          <rect x={MON.x + 50} y={MON.y + 150 + i * 34} width={78} height={14} rx={7} fill={GREY} />
          <rect x={MON.x + 146} y={MON.y + 150 + i * 34} width={54} height={14} rx={7} fill="#D3DFF0" />
          <rect x={MON.x + 214} y={MON.y + 150 + i * 34} width={48} height={14} rx={7} fill="#D3DFF0" />
        </g>
      ))}
      <motion.rect x={MON.x + 34} y={MON.y + 92} width={244} height={268} rx={14} fill="none" stroke={TEAL} strokeWidth={5} style={{ opacity: lit }} />

      {/* right panel - an inbox */}
      <rect x={MON.x + 302} y={MON.y + 92} width={244} height={268} rx={14} fill="#F7FAFE" stroke={EDGE} strokeWidth={3} />
      {rows.slice(0, 5).map((i) => (
        <g key={i}>
          <circle cx={MON.x + 332} cy={MON.y + 128 + i * 50} r={13} fill={i < 2 ? ACCENT : "#D3DFF0"} opacity={i < 2 ? 0.55 : 1} />
          <rect x={MON.x + 356} y={MON.y + 118 + i * 50} width={162} height={13} rx={6} fill={GREY} />
          <rect x={MON.x + 356} y={MON.y + 138 + i * 50} width={110} height={11} rx={5} fill="#DCE6F4" />
        </g>
      ))}
      <motion.rect x={MON.x + 302} y={MON.y + 92} width={244} height={268} rx={14} fill="none" stroke={TEAL} strokeWidth={5} style={{ opacity: lit }} />

      {/* stand */}
      <rect x={505} y={MON.y + MON.h} width={70} height={54} fill={EDGE} />
      <rect x={425} y={MON.y + MON.h + 54} width={230} height={18} rx={9} fill={EDGE} />
    </g>
  );
}

const T_SWAP = P0 + 0.5;                 // the model that was there lifts out
const T_NEW = P0 + 1.05;                 // the one that replaced it rises in
const T_SHELL = P0 + 2 * PGAP + 0.9;     // the shell around it never changed

function BayCard() {
  return (
    <g>
      <rect x={BAY.x} y={BAY.y} width={BAY.w} height={BAY.h} rx={26} fill={CARD} stroke={EDGE} strokeWidth={4} />
      <rect x={BAY.x + 16} y={BAY.y + 16} width={BAY.w - 32} height={BAY.h - 32} rx={16} fill="none" stroke={EDGE} strokeWidth={2} strokeDasharray="9 10" />
      {/* the tools sit on top of whatever model is underneath */}
      <line x1={540} y1={MON.y + MON.h + 72} x2={540} y2={BAY.y} stroke="#9FB4D2" strokeWidth={3} strokeDasharray="10 10" />
    </g>
  );
}

function Gears() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {SAT.map((s, i) => <Gear key={i} cx={s.cx} cy={s.cy} r={s.r} teeth={11} color="#C4D3E8" speed={30} dir={s.dir} tIn={0.7} />)}
      <Gear cx={HUB.cx} cy={HUB.cy} r={HUB.r} teeth={16} color="#8FA6C4" speed={20} dir={1} tIn={0.7} tOut={T_SWAP} lift={250} />
      <Gear cx={HUB.cx} cy={HUB.cy} r={HUB.r} teeth={16} color={ACCENT} speed={20} dir={1} tIn={T_NEW} rise={260} />
    </div>
  );
}

function Overlay() {
  const shell = useTransform(T, (t) => seg(t, T_SHELL, T_SHELL + 0.6));
  const shell2 = useTransform(T, (t) => seg(t, T_SHELL + 0.15, T_SHELL + 0.75));
  return (
    <svg width={W} height={CH} style={{ position: "absolute", inset: 0 }}>
      <motion.rect x={BAY.x} y={BAY.y} width={BAY.w} height={BAY.h} rx={26} fill="none" stroke={ACCENT} strokeWidth={5} style={{ opacity: shell }} />
      <motion.rect x={MON.x} y={MON.y} width={MON.w} height={MON.h} rx={26} fill="none" stroke={ACCENT} strokeWidth={5} style={{ opacity: shell2 }} />
      <Rail />
      {C.points.map((_, i) => {
        const t0 = P0 + i * PGAP;
        const [ax, ay] = ANCHOR[i];
        return (
          <g key={i}>
            <Leader x1={ax} y1={ay} x2={RAIL} y2={ay} t0={t0} dur={0.32} />
            <Leader x1={RAIL} y1={ay} x2={RAIL} y2={ROWS[i]} t0={t0 + 0.3} dur={0.36} />
            <Dot x={RAIL} y={ROWS[i]} t0={t0 + 0.62} color={DOTC[i]} />
          </g>
        );
      })}
    </svg>
  );
}

function Scene() {
  const o = useTransform(T, (t) => seg(t, 0.5, 1.2));
  const s = useTransform(T, (t) => 0.955 + 0.045 * seg(t, 0.5, 1.4, easeOutCubic));
  return (
    <motion.div style={{ position: "absolute", inset: 0, opacity: o, scale: s }}>
      <svg width={W} height={CH} style={{ position: "absolute", inset: 0 }}>
        <Screen />
        <BayCard />
      </svg>
      <Gears />
      <Overlay />
    </motion.div>
  );
}

// ----------------------------------------------------------------- typography

function Hook() {
  const lines = C.hook || [];
  return (
    <div style={{ position: "absolute", top: 168, left: RAIL, right: 96 }}>
      <div style={{ ...HL, fontSize: 92 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: i === lines.length - 1 ? ACCENT : INK }}>
            {l.split(" ").map((w, j) => <Word key={j} t0={0.9 + i * 0.42 + j * 0.1} dur={0.4}>{w}</Word>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function Labels() {
  return (
    <>
      {C.points.map((p, i) => {
        const t0 = P0 + i * PGAP + 0.72;
        const words = p.join(" ").split(" ");
        return (
          <div key={i} style={{ position: "absolute", left: RAIL + 54, right: 90, top: ROWS[i] - 84, height: 168, display: "flex", alignItems: "center" }}>
            <div style={{ ...BODY, fontSize: 54, maxWidth: 810 }}>
              {words.map((w, j) => <Word key={j} t0={t0 + j * 0.1} dur={0.36}>{w}</Word>)}
            </div>
          </div>
        );
      })}
    </>
  );
}

function Progress() {
  const w = useTransform(T, (t) => Math.max(0, Math.min(1, t / (C.duration || 22))) * (W - 2 * RAIL));
  const o = useTransform(T, (t) => seg(t, 0.6, 1.2) * (1 - seg(t, T_SWEEP - 0.2, T_SWEEP + 0.2)));
  return (
    <motion.div style={{ position: "absolute", left: RAIL, top: 1806, width: W - 2 * RAIL, height: 6, borderRadius: 3, background: "#D2DEEF", opacity: o }}>
      <motion.div style={{ height: 6, borderRadius: 3, width: w, background: `linear-gradient(90deg, ${ACCENT}, ${TEAL})` }} />
    </motion.div>
  );
}

function Mark() {
  const o = useTransform(T, (t) => 0.85 * seg(t, 0.8, 1.4));
  return <motion.img src="brand/logo_small.png" style={{ position: "absolute", top: 150, right: 90, width: 96, opacity: o }} />;
}

// --------------------------------------------------------------------- stat

function Stat() {
  const o = useTransform(T, (t) => seg(t, T_STAT, T_STAT + 0.4) * (1 - seg(t, T_SWEEP - 0.15, T_SWEEP + 0.25)));
  const s = useTransform(T, (t) => 0.93 + 0.07 * seg(t, T_STAT, T_STAT + 0.55, easeOutBack));
  const rule = useTransform(T, (t) => seg(t, T_STAT + 0.9, T_STAT + 1.5) * 420);
  const st = C.stat || {};
  return (
    <motion.div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: o }}>
      <motion.div style={{ scale: s, width: 900, background: CARD, borderRadius: 40, border: `4px solid ${EDGE}`, padding: "96px 72px", textAlign: "center" }}>
        {st.pre && (
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 44, color: MUTED, lineHeight: 1.3, letterSpacing: "0.01em" }}>
            {st.pre.split(" ").map((w, j) => <Word key={j} t0={T_STAT + 0.15 + j * 0.06} dur={0.3}>{w}</Word>)}
          </div>
        )}
        <div style={{ ...HL, fontSize: 104, color: RED, marginTop: 34 }}>
          {(st.big || "").split(" ").map((w, j) => <Word key={j} t0={T_STAT + 0.75 + j * 0.14} dur={0.38}>{w}</Word>)}
        </div>
        <motion.div style={{ height: 8, borderRadius: 4, background: RED, width: rule, margin: "34px auto 0" }} />
        {st.post && (
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 44, color: INK, marginTop: 40, lineHeight: 1.3 }}>
            {st.post.split(" ").map((w, j) => <Word key={j} t0={T_STAT + 1.7 + j * 0.07} dur={0.3}>{w}</Word>)}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Sweep() {
  const h = useTransform(T, (t) => seg(t, T_SWEEP, T_SWEEP + 0.55, easeOutCubic) * CH);
  return <motion.div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h, background: NAVY }} />;
}

// ---------------------------------------------------------------------- app

function App() {
  return (
    <div style={{ position: "relative", width: W, height: CH, overflow: "hidden", background: PAPER }}>
      <Backdrop />
      <Paper>
        <Scene />
        <Hook />
        <Labels />
        <Mark />
      </Paper>
      <Stat />
      <Progress />
      <Sweep />
      <EndCard tLogo={17.85} tTag={18.95} tBtn={19.65} tUrl={20.5} tagline={C.tagline} cta={C.cta} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
