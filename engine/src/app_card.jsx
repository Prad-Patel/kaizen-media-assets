// Kaizen still card - animated-infographic style, frozen.
//
// Same flat-vector language as the daily video (app_info.jsx): light paper,
// navy ink, electric blue and teal, no shadows. A monitor running everyday
// software sits above an engine bay where the model underneath has been
// swapped, and dashed leader lines run to a rail carrying the three points.
//
// Every glyph is real typography, nothing is AI-painted.
//
// window.__CONFIG = { kicker, headline:[lines] (or hook), points:[[line]],
//                     url, width, height }
import React from "react";
import { createRoot } from "react-dom/client";
import { ACCENT, TEAL } from "./shared";

const C = window.__CONFIG;
const W = C.width || 1080;
const H = C.height || 1350;
const PORTRAIT = H / W > 1.05;

// light-mode palette, identical to the video
const PAPER = "#EAF0F9";
const PAPER2 = "#DBE5F4";
const INK = "#0E2038";
const EDGE = "#C6D5EA";
const CARD = "#FFFFFF";
const NAVY = "#0A1628";
const GREY = "#A9BBD4";

const HL = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: INK, lineHeight: 1.06, letterSpacing: "-0.02em" };
const BODY = { fontFamily: "'Inter', sans-serif", fontWeight: 600, color: INK, lineHeight: 1.2 };

// scene geometry - the same numbers the video uses, so the still and the
// video are literally the same drawing
const MON = { x: 250, y: 520, w: 580, h: 400 };
const BAY = { x: 250, y: 1030, w: 580, h: 190 };
const HUB = { cx: 540, cy: 1125, r: 66 };
const SAT = [{ cx: 440, cy: 1089, r: 40 }, { cx: 640, cy: 1089, r: 40 }];
const SCENE = { x: 250, y: 520, w: 580, h: 700 }; // full bounding box
const DOTC = [ACCENT, TEAL, ACCENT];

const lines = C.headline || C.hook || [];
const points = C.points || [];

// ------------------------------------------------------------------- layout

function layout() {
  const pad = Math.round(W * 0.072);
  const footerH = Math.round(H * (PORTRAIT ? 0.082 : 0.1));
  const footTop = H - footerH;
  const kickerFS = Math.round(W * (PORTRAIT ? 0.0245 : 0.02));

  if (PORTRAIT) {
    const hlFS = Math.round(W * (lines.length > 2 ? 0.066 : 0.078));
    const hlLineH = hlFS * 1.08;
    const headBottom = pad + kickerFS * 1.9 + lines.length * hlLineH;
    const pointFS = Math.round(W * (H / W > 1.5 ? 0.042 : 0.037));
    const rowGap = Math.round(H * 0.086);
    const pointsBottom = footTop - Math.round(H * 0.045);
    const pointsTop = pointsBottom - (points.length - 1) * rowGap;
    const sceneTop = headBottom + Math.round(H * 0.03);
    const sceneH = pointsTop - Math.round(H * 0.075) - sceneTop;
    const s = sceneH / SCENE.h;
    return {
      pad, footerH, footTop, kickerFS, hlFS, hlLineH, pointFS, rowGap, pointsTop,
      rail: Math.round(W * 0.089),
      scene: { s, x: (W - SCENE.w * s) / 2, y: sceneTop },
      logoW: Math.round(W * 0.28), urlFS: Math.round(W * 0.026), markW: Math.round(W * 0.085),
    };
  }

  // landscape featured card
  const hlFS = Math.round(W * 0.048);
  const hlLineH = hlFS * 1.1;
  const pointFS = Math.round(W * 0.022);
  const rowGap = Math.round(H * 0.095);
  const sceneY = Math.round(H * 0.11);
  const sceneH = footTop - Math.round(H * 0.045) - sceneY;
  const s = sceneH / SCENE.h;
  return {
    pad, footerH, footTop, kickerFS, hlFS, hlLineH, pointFS, rowGap,
    pointsTop: Math.round(pad + kickerFS * 1.9 + lines.length * hlLineH + H * 0.085),
    rail: Math.round(W * 0.058),
    scene: { s, x: W - pad - SCENE.w * s, y: sceneY },
    logoW: Math.round(W * 0.16), urlFS: Math.round(W * 0.021), markW: Math.round(W * 0.05),
  };
}

const L = layout();

// --------------------------------------------------------------- primitives

function gearPath(cx, cy, r, teeth) {
  const rt = r, rr = r * 0.79;
  const step = (Math.PI * 2) / teeth;
  const at = [[rr, 0.0], [rt, 0.15], [rt, 0.35], [rr, 0.5], [rr, 0.66], [rr, 0.83]];
  let d = "";
  for (let i = 0; i < teeth; i++) {
    for (const [rad, f] of at) {
      const a = (i + f) * step;
      d += (d ? "L" : "M") + (cx + Math.cos(a) * rad).toFixed(2) + " " + (cy + Math.sin(a) * rad).toFixed(2) + " ";
    }
  }
  return d + "Z";
}

function Gear({ cx, cy, r, teeth = 14, color, rot = 0 }) {
  return (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
      <path d={gearPath(cx, cy, r, teeth)} fill={color} />
      <circle cx={cx} cy={cy} r={r * 0.3} fill={CARD} />
      <circle cx={cx} cy={cy} r={r * 0.13} fill={color} />
    </g>
  );
}

// ------------------------------------------------------------------ backdrop

function Backdrop() {
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
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
      <rect width={W} height={H} fill={PAPER} />
      <rect width={W} height={H} fill="url(#dots)" />
      <circle cx={W * 0.81} cy={H * 0.22} r={W * 0.43} fill="url(#glowA)" />
      <circle cx={W * 0.15} cy={H * 0.74} r={W * 0.44} fill="url(#glowB)" />
    </svg>
  );
}

// --------------------------------------------------------------------- scene

// The monitor, the bay and the gears, drawn exactly as the video draws them,
// held at the state the video ends on: the tools on top are unchanged and the
// model underneath has been replaced.
function Scene() {
  const rows = [0, 1, 2, 3, 4, 5];
  const { s, x, y } = L.scene;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(${-SCENE.x} ${-SCENE.y})`}>
      {/* monitor shell */}
      <rect x={MON.x} y={MON.y} width={MON.w} height={MON.h} rx={26} fill={CARD} stroke={EDGE} strokeWidth={4} />
      <path d={`M${MON.x} ${MON.y + 26} a26 26 0 0 1 26 -26 h${MON.w - 52} a26 26 0 0 1 26 26 v34 h${-MON.w} z`} fill="#F2F6FD" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={MON.x + 34 + i * 26} cy={MON.y + 30} r={7} fill={i === 0 ? "#E4B7B9" : i === 1 ? "#E8D6AE" : "#B9DCC6"} />
      ))}

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
      <rect x={MON.x + 34} y={MON.y + 92} width={244} height={268} rx={14} fill="none" stroke={TEAL} strokeWidth={5} />

      {/* right panel - an inbox */}
      <rect x={MON.x + 302} y={MON.y + 92} width={244} height={268} rx={14} fill="#F7FAFE" stroke={EDGE} strokeWidth={3} />
      {rows.slice(0, 5).map((i) => (
        <g key={i}>
          <circle cx={MON.x + 332} cy={MON.y + 128 + i * 50} r={13} fill={i < 2 ? ACCENT : "#D3DFF0"} opacity={i < 2 ? 0.55 : 1} />
          <rect x={MON.x + 356} y={MON.y + 118 + i * 50} width={162} height={13} rx={6} fill={GREY} />
          <rect x={MON.x + 356} y={MON.y + 138 + i * 50} width={110} height={11} rx={5} fill="#DCE6F4" />
        </g>
      ))}
      <rect x={MON.x + 302} y={MON.y + 92} width={244} height={268} rx={14} fill="none" stroke={TEAL} strokeWidth={5} />

      {/* stand */}
      <rect x={505} y={MON.y + MON.h} width={70} height={54} fill={EDGE} />
      <rect x={425} y={MON.y + MON.h + 54} width={230} height={18} rx={9} fill={EDGE} />

      {/* the tools sit on top of whatever model is underneath */}
      <line x1={540} y1={MON.y + MON.h + 72} x2={540} y2={BAY.y} stroke="#9FB4D2" strokeWidth={3} strokeDasharray="10 10" />

      {/* engine bay */}
      <rect x={BAY.x} y={BAY.y} width={BAY.w} height={BAY.h} rx={26} fill={CARD} stroke={EDGE} strokeWidth={4} />
      <rect x={BAY.x + 16} y={BAY.y + 16} width={BAY.w - 32} height={BAY.h - 32} rx={16} fill="none" stroke={EDGE} strokeWidth={2} strokeDasharray="9 10" />
      {SAT.map((g, i) => <Gear key={i} cx={g.cx} cy={g.cy} r={g.r} teeth={11} color="#C4D3E8" rot={i * 9} />)}
      <Gear cx={HUB.cx} cy={HUB.cy} r={HUB.r} teeth={16} color={ACCENT} rot={6} />

      {/* the part that changed, and the shell that did not */}
      <rect x={BAY.x} y={BAY.y} width={BAY.w} height={BAY.h} rx={26} fill="none" stroke={ACCENT} strokeWidth={5} />
      <rect x={MON.x} y={MON.y} width={MON.w} height={MON.h} rx={26} fill="none" stroke={ACCENT} strokeWidth={5} />
    </g>
  );
}

// ------------------------------------------------------- rail, dots, leader

function Rail() {
  const rows = points.map((_, i) => L.pointsTop + i * L.rowGap);
  if (!rows.length) return null;
  const { s, x, y } = L.scene;
  // leader from the bay out to the rail, then down to the first point, the
  // same L-shaped dashed run the video draws
  const bayY = y + (HUB.cy - SCENE.y) * s;
  const bayX = x;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {PORTRAIT && (
        <>
          <line x1={bayX} y1={bayY} x2={L.rail} y2={bayY} stroke="#9FB4D2" strokeWidth={3} strokeDasharray="11 11" strokeLinecap="round" />
          <line x1={L.rail} y1={bayY} x2={L.rail} y2={rows[0]} stroke="#9FB4D2" strokeWidth={3} strokeDasharray="11 11" strokeLinecap="round" />
        </>
      )}
      <line x1={L.rail} y1={rows[0]} x2={L.rail} y2={rows[rows.length - 1]} stroke="#B4C6DE" strokeWidth={2} strokeDasharray="8 11" />
      {rows.map((ry, i) => (
        <circle key={i} cx={L.rail} cy={ry} r={PORTRAIT ? 15 : 11} fill={DOTC[i % DOTC.length]} />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------- type layer

function Head() {
  return (
    <div style={{ position: "absolute", left: L.rail, top: L.pad, width: PORTRAIT ? W - L.rail - L.pad : W * 0.56 }}>
      {C.kicker && (
        <div style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: L.kickerFS, color: "#1E9E7E",
          letterSpacing: "0.2em", textIndent: "0.2em", marginBottom: L.kickerFS * 0.7,
        }}>
          {C.kicker.toUpperCase()}
        </div>
      )}
      <div style={{ ...HL, fontSize: L.hlFS }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: i === lines.length - 1 && lines.length > 1 ? ACCENT : INK, lineHeight: `${L.hlLineH}px` }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function Points() {
  return (
    <>
      {points.map((p, i) => {
        const top = L.pointsTop + i * L.rowGap;
        return (
          <div key={i} style={{
            position: "absolute", left: L.rail + (PORTRAIT ? 54 : 34),
            right: PORTRAIT ? L.pad + 12 : W * 0.46,
            top: top - L.rowGap / 2, height: L.rowGap,
            display: "flex", alignItems: "center",
          }}>
            <div style={{ ...BODY, fontSize: L.pointFS }}>{p.join(" ")}</div>
          </div>
        );
      })}
    </>
  );
}

// portrait only - in landscape the scene sits top-right and the footer
// already carries the full wordmark
function Mark() {
  if (!PORTRAIT) return null;
  return <img src="brand/logo_small.png" style={{ position: "absolute", top: L.pad, right: L.pad, width: L.markW, opacity: 0.9 }} />;
}

function Footer() {
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: L.footTop, height: L.footerH, background: NAVY,
      display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${L.pad}px`, boxSizing: "border-box",
    }}>
      <img src="brand/logo.png" style={{ width: L.logoW, display: "block" }} />
      <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: L.urlFS, color: "#9FB6DC", letterSpacing: "0.04em" }}>
        {C.url || "kaizenaiconsulting.com"}
      </div>
    </div>
  );
}

function App() {
  return (
    <div style={{ position: "relative", width: W, height: H, overflow: "hidden", background: PAPER }}>
      <Backdrop />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}><Scene /></svg>
      <Rail />
      <Head />
      <Points />
      <Mark />
      <Footer />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
