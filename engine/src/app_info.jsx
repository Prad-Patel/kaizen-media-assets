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
import { T, seg, easeOutBack, easeOutCubic, easeInCubic, ACCENT, TEAL, RED } from "./shared";

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

// Which scene to draw. "engine" is the original monitor-over-engine-bay
// diagram; "choice" is three cases on a bench, each revealing a different
// mechanism, for comparison topics. New scenes get added here as topics
// need them - the rail, typography and timeline stay identical across all.
const SCENE_KEY = ["engine", "choice"].includes(C.scene) ? C.scene : "engine";

// Hybrid mode: the first section plays over generated footage of the day's
// illustration (composited by render_hybrid.sh), so the paper backdrop and the
// vector scene stay out of the way until the stat, and the type gets a light
// halo hugging the glyphs for readability over the moving image.
const HYBRID = !!C.hybrid;

// Per-element text tones, decided by pick_text_style.py from the footage
// behind each block: "ink" (navy type, light halo) on light backgrounds,
// "light" (white type, dark glyph shadow) on dark ones.
const PLAN = C.textPlan || {};
const HALO_LIGHT = "0 1px 0 rgba(234,240,249,.95), 0 0 14px rgba(234,240,249,.95), 0 0 34px rgba(234,240,249,.85), 0 0 64px rgba(234,240,249,.6)";
const HALO_DARK = "0 1px 2px rgba(4,10,20,.95), 0 0 12px rgba(4,10,20,.9), 0 0 30px rgba(4,10,20,.8), 0 0 58px rgba(4,10,20,.55)";
const toneStyle = (tone, accent) => {
  if (!HYBRID) return { color: accent ? ACCENT : undefined, textShadow: "none" };
  return tone === "light"
    ? { color: accent ? "#8FBAFF" : "#FFFFFF", textShadow: HALO_DARK }
    : { color: accent ? ACCENT : undefined, textShadow: HALO_LIGHT };
};

// choice scene geometry
const CH_BX = [300, 540, 780];
const CH_BOX = { w: 190, h: 120, topY: 790, benchY: 910 };

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
  const o = useTransform(T, (t) => HYBRID
    ? seg(t, T_CLEAR, T_CLEAR + 0.4) * (1 - seg(t, T_SWEEP, T_SWEEP + 0.5))
    : 1 - seg(t, T_SWEEP, T_SWEEP + 0.5));
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

// -------------------------------------------------------------- choice scene
// Three cases on a bench, each one opening to show a different mechanism:
// a single gear, a cluster of modules, a network of nodes. Comparison topics.

function ChoiceBench() {
  return (
    <g>
      <rect x={150} y={CH_BOX.benchY} width={780} height={16} rx={8} fill={EDGE} />
      <rect x={205} y={CH_BOX.benchY + 16} width={20} height={96} fill={EDGE} />
      <rect x={855} y={CH_BOX.benchY + 16} width={20} height={96} fill={EDGE} />
    </g>
  );
}

function ChoiceBox({ i }) {
  const bx = CH_BX[i];
  const t0 = P0 + i * PGAP + 0.25;
  const lidY = useTransform(T, (t) => -seg(t, t0, t0 + 0.6, easeOutCubic) * 70);
  const lidO = useTransform(T, (t) => 1 - 0.85 * seg(t, t0 + 0.25, t0 + 0.75));
  const lit = useTransform(T, (t) => seg(t, t0 + 0.35, t0 + 0.9));
  return (
    <g>
      <rect x={bx - CH_BOX.w / 2} y={CH_BOX.topY} width={CH_BOX.w} height={CH_BOX.h} rx={16} fill={CARD} stroke={EDGE} strokeWidth={4} />
      <rect x={bx - CH_BOX.w / 2 + 14} y={CH_BOX.topY + 14} width={CH_BOX.w - 28} height={CH_BOX.h - 28} rx={10} fill="none" stroke={EDGE} strokeWidth={2} strokeDasharray="8 9" />
      <motion.rect x={bx - CH_BOX.w / 2 - 8} y={CH_BOX.topY - 22} width={CH_BOX.w + 16} height={30} rx={10} fill="#8FA6C4" style={{ y: lidY, opacity: lidO }} />
      <motion.rect x={bx - CH_BOX.w / 2} y={CH_BOX.topY} width={CH_BOX.w} height={CH_BOX.h} rx={16} fill="none" stroke={i === 1 ? TEAL : ACCENT} strokeWidth={5} style={{ opacity: lit }} />
    </g>
  );
}

function ChoiceGlow({ i }) {
  const t0 = P0 + i * PGAP + 0.4;
  const o = useTransform(T, (t) => 0.5 * seg(t, t0, t0 + 0.7));
  const color = i === 1 ? TEAL : ACCENT;
  return (
    <motion.div style={{ position: "absolute", left: CH_BX[i] - 130, top: 540, width: 260, height: 260, borderRadius: "50%", opacity: o, background: `radial-gradient(circle, ${color}2E 0%, ${color}00 70%)` }} />
  );
}

function RiseIn({ t0, cx, cy, rise = 190, children }) {
  const o = useTransform(T, (t) => seg(t, t0, t0 + 0.5));
  const y = useTransform(T, (t) => (1 - seg(t, t0, t0 + 0.8, easeOutCubic)) * rise);
  return (
    <motion.div style={{ position: "absolute", left: cx - 90, top: cy - 90, width: 180, height: 180, opacity: o, y, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </motion.div>
  );
}

function ModulesGlyph() {
  const sq = (x, y, c, r = 22) => <rect key={x + "-" + y} x={x} y={y} width={54} height={54} rx={r ? 12 : 0} fill={c} />;
  return (
    <svg width={150} height={150} viewBox="0 0 150 150">
      {sq(14, 14, ACCENT)}{sq(82, 14, TEAL)}{sq(14, 82, TEAL)}{sq(82, 82, "#8FA6C4")}
    </svg>
  );
}

function NetworkGlyph() {
  const N = [[75, 16], [22, 62], [128, 58], [46, 122], [104, 124], [75, 74]];
  const L = [[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [0, 2], [1, 3], [2, 4]];
  return (
    <svg width={150} height={150} viewBox="0 0 150 150">
      {L.map(([a, b], k) => <line key={k} x1={N[a][0]} y1={N[a][1]} x2={N[b][0]} y2={N[b][1]} stroke={TEAL} strokeWidth={3.5} />)}
      {N.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={k === 5 ? 15 : 11} fill={k === 5 ? ACCENT : TEAL} />)}
    </svg>
  );
}

function ChoiceMechs() {
  const beats = [0, 1, 2].map((i) => P0 + i * PGAP + 0.45);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {[0, 1, 2].map((i) => <ChoiceGlow key={"g" + i} i={i} />)}
      <Gear cx={CH_BX[0]} cy={650} r={58} teeth={14} color={ACCENT} speed={22} dir={1} tIn={beats[0]} rise={200} hole={PAPER} />
      <RiseIn t0={beats[1]} cx={CH_BX[1]} cy={650}><ModulesGlyph /></RiseIn>
      <RiseIn t0={beats[2]} cx={CH_BX[2]} cy={650}><NetworkGlyph /></RiseIn>
    </div>
  );
}

function ChoiceOverlay() {
  return (
    <svg width={W} height={CH} style={{ position: "absolute", inset: 0 }}>
      <Rail />
      {C.points.map((_, i) => {
        const t0 = P0 + i * PGAP;
        const ax = CH_BX[i], ay = CH_BOX.benchY + 30;
        return (
          <g key={i}>
            <Leader x1={ax} y1={ay} x2={ax} y2={ROWS[i]} t0={t0} dur={0.34} />
            <Leader x1={ax} y1={ROWS[i]} x2={RAIL} y2={ROWS[i]} t0={t0 + 0.32} dur={0.34} />
            <Dot x={RAIL} y={ROWS[i]} t0={t0 + 0.62} color={DOTC[i]} />
          </g>
        );
      })}
    </svg>
  );
}

function SceneChoice() {
  return (
    <>
      <svg width={W} height={CH} style={{ position: "absolute", inset: 0 }}>
        <ChoiceBench />
        {[0, 1, 2].map((i) => <ChoiceBox key={i} i={i} />)}
      </svg>
      <ChoiceMechs />
      <ChoiceOverlay />
    </>
  );
}

function HybridOverlay() {
  // over footage there is nothing to point at, so just the rail and the dots
  return (
    <svg width={W} height={CH} style={{ position: "absolute", inset: 0 }}>
      <Rail />
      {C.points.map((_, i) => (
        <Dot key={i} x={RAIL} y={ROWS[i]} t0={P0 + i * PGAP + 0.62} color={DOTC[i]} />
      ))}
    </svg>
  );
}

function Scene() {
  const o = useTransform(T, (t) => seg(t, 0.5, 1.2));
  const s = useTransform(T, (t) => 0.955 + 0.045 * seg(t, 0.5, 1.4, easeOutCubic));
  if (HYBRID) return <HybridOverlay />;
  return (
    <motion.div style={{ position: "absolute", inset: 0, opacity: o, scale: s }}>
      {SCENE_KEY === "choice" ? (
        <SceneChoice />
      ) : (
        <>
          <svg width={W} height={CH} style={{ position: "absolute", inset: 0 }}>
            <Screen />
            <BayCard />
          </svg>
          <Gears />
          <Overlay />
        </>
      )}
    </motion.div>
  );
}

// ----------------------------------------------------------------- typography

function Hook() {
  const lines = C.hook || [];
  return (
    <div style={{ position: "absolute", top: 168, left: RAIL, right: 96 }}>
      <div style={{ ...HL, fontSize: 92 }}>
        {lines.map((l, i) => {
          const accent = i === lines.length - 1;
          const ts = toneStyle(PLAN.hook, accent);
          return (
            <div key={i} style={{ color: ts.color || INK, textShadow: ts.textShadow }}>
              {l.split(" ").map((w, j) => <Word key={j} t0={0.9 + i * 0.42 + j * 0.1} dur={0.4}>{w}</Word>)}
            </div>
          );
        })}
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
            <div style={{ ...BODY, fontSize: 54, maxWidth: 810, color: toneStyle((PLAN.labels || [])[i]).color || INK, textShadow: toneStyle((PLAN.labels || [])[i]).textShadow }}>
              {words.map((w, j) => <Word key={j} t0={t0 + j * 0.1} dur={0.36}>{w}</Word>)}
            </div>
          </div>
        );
      })}
    </>
  );
}

function Progress() {
  // fills across the infographic and reads full exactly as the sweep starts,
  // so a longer end card does not leave it stranded part-way
  const w = useTransform(T, (t) => Math.max(0, Math.min(1, t / T_SWEEP)) * (W - 2 * RAIL));
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

// ----------------------------------------------------------------- end card

// The blog video has three jobs: get the like, get the follow, get the click
// through to the article. So the end card asks for all three, cheapest first,
// with the article as the one filled button because that is the conversion.
const T_LOGO = 17.85, T_TAG = 18.65, T_CHIP = 19.45, T_BTN = 20.5, T_URL = 21.5;

const ICONS = {
  // filled heart
  heart: { fill: "M12 20.6S3.9 15.5 3.9 9.9C3.9 7 6 5 8.5 5c1.6 0 2.9.8 3.5 2 .6-1.2 1.9-2 3.5-2C18 5 20.1 7 20.1 9.9c0 5.6-8.1 10.7-8.1 10.7z" },
  // plus
  plus: { stroke: "M12 5.2v13.6M5.2 12h13.6" },
  // arrow
  arrow: { stroke: "M4.6 12h13.2M11.6 5.6L18 12l-6.4 6.4" },
};

function Icon({ name, size = 40, color }) {
  const d = ICONS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flex: "none" }}>
      {d.fill
        ? <path d={d.fill} fill={color} />
        : <path d={d.stroke} fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

// outlined pill for the two soft asks
function Chip({ t0, icon, color, children }) {
  const o = useTransform(T, (t) => seg(t, t0, t0 + 0.4));
  const s = useTransform(T, (t) => 0.88 + 0.12 * seg(t, t0, t0 + 0.5, easeOutBack));
  return (
    <motion.div style={{
      display: "flex", alignItems: "center", gap: 18, padding: "22px 44px", borderRadius: 100,
      border: `3px solid ${color}`, background: "rgba(255,255,255,0.05)", opacity: o, scale: s,
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 40, color: "#fff", whiteSpace: "nowrap",
    }}>
      <Icon name={icon} color={color} />
      {children}
    </motion.div>
  );
}

function EndCardSocial() {
  const logoO = useTransform(T, (t) => seg(t, T_LOGO, T_LOGO + 0.5));
  const logoY = useTransform(T, (t) => (1 - seg(t, T_LOGO, T_LOGO + 0.6)) * 40);
  const tagO = useTransform(T, (t) => seg(t, T_TAG, T_TAG + 0.45));
  const btnO = useTransform(T, (t) => seg(t, T_BTN, T_BTN + 0.4));
  const btnS = useTransform(T, (t) => 0.86 + 0.14 * seg(t, T_BTN, T_BTN + 0.5, easeOutBack));
  const btnPulse = useTransform(T, (t) => 1 + 0.022 * Math.sin((t - T_BTN - 0.6) * 5.0) * (t > T_BTN + 0.6 ? 1 : 0));
  const urlO = useTransform(T, (t) => seg(t, T_URL, T_URL + 0.4));
  const tag = C.tagline || "";
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingBottom: 90 }}>
      <motion.img src="brand/logo.png" style={{ width: 660, display: "block", opacity: logoO, y: logoY }} />

      <motion.div style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: tag.length > 42 ? 38 : 44,
        lineHeight: 1.28, maxWidth: 880, textAlign: "center", marginTop: 72, opacity: tagO, color: "#DCE8FF",
      }}>
        {tag}
      </motion.div>

      <div style={{ display: "flex", gap: 28, marginTop: 74 }}>
        <Chip t0={T_CHIP} icon="heart" color={RED}>LIKE</Chip>
        <Chip t0={T_CHIP + 0.28} icon="plus" color={TEAL}>FOLLOW</Chip>
      </div>

      <motion.div style={{ scale: btnPulse, marginTop: 40 }}>
        <motion.div style={{
          display: "flex", alignItems: "center", gap: 22, padding: "30px 62px", borderRadius: 100,
          background: ACCENT, opacity: btnO, scale: btnS,
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 48, color: "#fff",
          boxShadow: `0 0 90px ${ACCENT}77, 0 14px 50px rgba(0,0,0,.45)`, whiteSpace: "nowrap",
        }}>
          {C.cta || "READ THE FULL ARTICLE"}
          <Icon name="arrow" size={44} color="#fff" />
        </motion.div>
      </motion.div>

      <motion.div style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 36, marginTop: 44,
        opacity: urlO, color: "#9FB6DC", letterSpacing: "0.04em",
      }}>
        {C.url || "kaizenaiconsulting.com"}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------- app

function App() {
  return (
    <div style={{ position: "relative", width: W, height: CH, overflow: "hidden", background: HYBRID ? "transparent" : PAPER }}>
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
      <EndCardSocial />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
