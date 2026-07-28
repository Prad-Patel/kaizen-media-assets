import React from "react";
import { createRoot } from "react-dom/client";
import { motion, useTransform } from "framer-motion";
import { T, seg, easeOutBack, ACCENT, TEAL, RED, H, SUB, Word, Line, Block, EndCard, Watermark } from "./shared.jsx";

// Parametric daily social video — the TYPOGRAPHY LAYER ONLY.
// This composition renders on a transparent canvas. capture.js writes RGBA PNGs
// and render.sh composites them over a graded b-roll base track in ffmpeg, the
// same way the Campaign 1 and Campaign 2 ads were built. Nothing here paints a
// background, and no text is ever AI-generated.
//
// window.__CONFIG = { hook:[lines], points:[[line],[line],[line]], stat:{pre,big,post}, cta, tagline, url }
// Timeline: hook 0-4.5 | points 4.5-13.5 | stat 13.5-17.5 | end 17.5-22.0
// The footage cuts on those same boundaries.
const C = window.__CONFIG;
const DUR = C.duration || 22.0;

// Thin broadcast progress rule along the bottom. Reads as edit furniture, not
// as a panel behind the type.
function Progress() {
  const w = useTransform(T, (t) => Math.max(0, Math.min(1, t / DUR)) * 1080);
  const o = useTransform(T, (t) => seg(t, 0.4, 1.2) * (1 - seg(t, DUR - 4.6, DUR - 4.0)));
  return (
    <motion.div style={{ position: "absolute", left: 0, bottom: 96, height: 6, width: 1080, opacity: o }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.14)" }} />
      <motion.div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: w, background: `linear-gradient(90deg, ${ACCENT} 0%, ${TEAL} 100%)`, boxShadow: `0 0 22px ${ACCENT}aa` }} />
    </motion.div>
  );
}

function Hook() {
  return (
    <Block tOut={4.2} style={{ top: 0, height: 1920, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "0 90px", marginTop: -160 }}>
        {C.hook.map((line, i) => (
          <div key={i} style={{ ...H, fontSize: i === C.hook.length - 1 ? 130 : 96, marginTop: i ? 14 : 0 }}>
            {line.split(" ").map((w, j) => (
              <Word key={j} t0={0.5 + i * 0.55 + j * 0.16} dur={0.4}
                style={i === C.hook.length - 1 ? { color: ACCENT, textShadow: `0 0 6px rgba(0,0,0,.95), 0 0 18px rgba(0,0,0,.9), 0 0 40px rgba(0,0,0,.7), 0 0 70px ${ACCENT}66` } : {}}>
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
        const t0 = 4.5 + i * 3.0, tEnd = t0 + 2.72;
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
          <Word t0={14.0} dur={0.42} style={{ color: RED, textShadow: `0 0 6px rgba(0,0,0,.95), 0 0 18px rgba(0,0,0,.9), 0 0 40px rgba(0,0,0,.7), 0 0 70px ${RED}55` }}>{C.stat.big}</Word>
        </motion.div>
        {C.stat.post && <Line t0={15.4} style={{ ...H, fontSize: 58, marginTop: 26, color: "#E4EEFB" }}>{C.stat.post}</Line>}
      </div>
    </Block>
  );
}

function App() {
  return (
    <div style={{ position: "relative", width: 1080, height: 1920, overflow: "hidden" }}>
      <Watermark tIn={0.8} tOut={17.0} />
      <Hook />
      <Points />
      <Stat />
      <Progress />
      <EndCard tLogo={17.8} tTag={18.9} tBtn={19.6} tUrl={20.5} tagline={C.tagline} cta={C.cta} />
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
