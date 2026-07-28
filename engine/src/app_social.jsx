import React from "react";
import { createRoot } from "react-dom/client";
import { motion, useTransform } from "framer-motion";
import { T, seg, easeOutBack, ACCENT, TEAL, RED, H, SUB, Word, Line, Block, EndCard } from "./shared.jsx";

// Parametric daily social video — pure motion graphics, config-driven.
// window.__CONFIG = { hook:[lines], points:[[line],[line],[line]], stat:{pre,big,post}, cta, tagline, url }
// Timeline: hook 0-4.5 | points 4.5-13.5 | stat 13.5-17.5 | end 17.5-22.0
const C = window.__CONFIG;

// ---- Animated brand background (deterministic in T) ----
function Background() {
  const drift1 = useTransform(T, (t) => 200 * Math.sin(t * 0.18));
  const drift1y = useTransform(T, (t) => 140 * Math.cos(t * 0.13));
  const drift2 = useTransform(T, (t) => -240 * Math.sin(t * 0.11 + 2));
  const drift2y = useTransform(T, (t) => -160 * Math.cos(t * 0.16 + 1));
  const pulse = useTransform(T, (t) => 1 + 0.08 * Math.sin(t * 0.5));
  // seeded particles
  const parts = [];
  for (let i = 0; i < 42; i++) {
    const sx = ((i * 733) % 1080), sp = 12 + ((i * 97) % 30), sz = 3 + ((i * 61) % 9);
    parts.push({ i, sx, sp, sz, ph: (i * 1.7) % 6.28 });
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(175deg, #0A1628 0%, #0C1E38 45%, #081120 100%)" }}>
      <motion.div style={{ position: "absolute", width: 1400, height: 1400, borderRadius: "50%", left: -300, top: 100, x: drift1, y: drift1y, scale: pulse, background: "radial-gradient(circle, rgba(46,124,246,0.20) 0%, rgba(46,124,246,0) 62%)" }} />
      <motion.div style={{ position: "absolute", width: 1100, height: 1100, borderRadius: "50%", right: -350, bottom: 60, x: drift2, y: drift2y, background: "radial-gradient(circle, rgba(52,211,166,0.10) 0%, rgba(52,211,166,0) 60%)" }} />
      {parts.map((p) => <Particle key={p.i} {...p} />)}
      {/* subtle vignette for text pop */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 120% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(2,6,14,0.55) 100%)" }} />
    </div>
  );
}
function Particle({ sx, sp, sz, ph }) {
  const y = useTransform(T, (t) => 1980 - (((t * sp + ph * 300) % 2100)));
  const x = useTransform(T, (t) => sx + 30 * Math.sin(t * 0.4 + ph));
  const o = useTransform(T, (t) => 0.25 + 0.2 * Math.sin(t * 0.8 + ph));
  return <motion.div style={{ position: "absolute", width: sz, height: sz, borderRadius: "50%", background: "#7FB0FF", filter: "blur(1px)", x, y, opacity: o }} />;
}

function Hook() {
  return (
    <Block tOut={4.2} style={{ top: 0, height: 1920, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "0 90px", marginTop: -160 }}>
        {C.hook.map((line, i) => (
          <div key={i} style={{ ...H, fontSize: i === C.hook.length - 1 ? 130 : 96, marginTop: i ? 14 : 0 }}>
            {line.split(" ").map((w, j) => (
              <Word key={j} t0={0.5 + i * 0.55 + j * 0.16} dur={0.4}
                style={i === C.hook.length - 1 ? { color: ACCENT, textShadow: `0 0 6px rgba(0,0,0,.9), 0 0 16px rgba(0,0,0,.85), 0 0 60px ${ACCENT}66` } : {}}>
                {w}
              </Word>
            ))}
          </div>
        ))}
      </div>
    </Block>
  );
}

function Points() {
  return (
    <>
      {C.points.map((p, i) => {
        const t0 = 4.5 + i * 3.0, tEnd = t0 + 2.75;
        return (
          <Block key={i} tOut={tEnd} style={{ top: 0, height: 1920, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", padding: "0 90px", marginTop: -120 }}>
              <Line t0={t0 + 0.15} style={{ ...SUB, fontSize: 46, color: TEAL, letterSpacing: "0.3em", textIndent: "0.3em", marginBottom: 30 }}>{String(i + 1).padStart(2, "0")}</Line>
              <div style={{ ...H, fontSize: 88 }}>
                {p.join(" ").split(" ").map((w, j) => (
                  <Word key={j} t0={t0 + 0.3 + j * 0.13} dur={0.38}>{w}</Word>
                ))}
              </div>
            </div>
          </Block>
        );
      })}
    </>
  );
}

function Stat() {
  const jx = useTransform(T, (t) => Math.sin(t * 90) * 7 * (t > 13.9 && t < 14.5 ? 1 : 0));
  return (
    <Block tOut={17.2} style={{ top: 0, height: 1920, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "0 90px", marginTop: -140 }}>
        {C.stat.pre && <Line t0={13.75} style={{ ...H, fontSize: 62, color: "#E4EEFB" }}>{C.stat.pre}</Line>}
        <motion.div style={{ ...H, fontSize: 120, marginTop: 20, x: jx }}>
          <Word t0={14.0} dur={0.42} style={{ color: RED, textShadow: `0 0 6px rgba(0,0,0,.9), 0 0 16px rgba(0,0,0,.85), 0 0 60px ${RED}55` }}>{C.stat.big}</Word>
        </motion.div>
        {C.stat.post && <Line t0={15.4} style={{ ...H, fontSize: 58, marginTop: 26, color: "#E4EEFB" }}>{C.stat.post}</Line>}
      </div>
    </Block>
  );
}

function App() {
  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      <Background />
      <Hook />
      <Points />
      <Stat />
      <EndCard tLogo={17.8} tTag={18.9} tBtn={19.6} tUrl={20.5} tagline={C.tagline} />
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
