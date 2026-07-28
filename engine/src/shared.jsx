import React from "react";
import { motion, motionValue, useTransform } from "framer-motion";

export const T = motionValue(0);
window.__seek = (t) => { T.set(t); };

export const easeOutBack = (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
export const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);
export const easeInCubic = (p) => p * p * p;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const seg = (t, a, b, ease = easeOutCubic) => ease(clamp01((t - a) / (b - a)));

export const ACCENT = "#2E7CF6";
export const TEAL = "#34D3A6";
export const RED = "#FF5A5F";

export const H = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "#fff", textShadow: "0 0 6px rgba(0,0,0,.9), 0 0 16px rgba(0,0,0,.85), 0 0 34px rgba(0,0,0,.65), 0 2px 6px rgba(0,0,0,.9)", lineHeight: 1.06, letterSpacing: "-0.01em" };
export const SUB = { fontFamily: "'Inter', sans-serif", fontWeight: 600, color: "#fff", textShadow: "0 0 6px rgba(0,0,0,.85), 0 0 14px rgba(0,0,0,.8), 0 0 28px rgba(0,0,0,.6), 0 2px 5px rgba(0,0,0,.85)" };

export function Word({ t0, children, style = {}, dur = 0.32 }) {
  const o = useTransform(T, (t) => seg(t, t0, t0 + dur));
  const y = useTransform(T, (t) => (1 - seg(t, t0, t0 + dur)) * 46);
  const s = useTransform(T, (t) => 0.86 + 0.14 * seg(t, t0, t0 + dur, easeOutBack));
  return (
    <motion.span style={{ display: "inline-block", opacity: o, y, scale: s, marginRight: "0.28em", ...style }}>
      {children}
    </motion.span>
  );
}

export function Line({ t0, children, style = {}, dur = 0.45 }) {
  const o = useTransform(T, (t) => seg(t, t0, t0 + dur));
  const y = useTransform(T, (t) => (1 - seg(t, t0, t0 + dur)) * 34);
  return <motion.div style={{ opacity: o, y, ...style }}>{children}</motion.div>;
}

export function Block({ tOut, children, style = {} }) {
  const o = useTransform(T, (t) => 1 - seg(t, tOut, tOut + 0.35, easeInCubic));
  const y = useTransform(T, (t) => -seg(t, tOut, tOut + 0.35) * 60);
  return <motion.div style={{ position: "absolute", left: 0, right: 0, opacity: o, y, ...style }}>{children}</motion.div>;
}

export function Scrim({ tIn, tOut }) {
  const o = useTransform(T, (t) => 0.62 * seg(t, tIn, tIn + 0.45) * (1 - seg(t, tOut, tOut + 0.4)));
  return <motion.div style={{ position: "absolute", left: -80, right: -80, top: -160, height: 1100, opacity: o, background: "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(4,10,20,0.92) 0%, rgba(4,10,20,0.75) 55%, rgba(4,10,20,0) 78%)" }} />;
}

// End card: logo + tagline + audit button + url. Times passed in.
export function EndCard({ tLogo, tTag, tBtn, tUrl, tagline, cta = "FREE 30-MIN AI AUDIT" }) {
  const wmO = useTransform(T, (t) => seg(t, tLogo, tLogo + 0.5));
  const wmY = useTransform(T, (t) => (1 - seg(t, tLogo, tLogo + 0.6)) * 40);
  const tagO = useTransform(T, (t) => seg(t, tTag, tTag + 0.45));
  const btnO = useTransform(T, (t) => seg(t, tBtn, tBtn + 0.4));
  const btnS = useTransform(T, (t) => 0.85 + 0.15 * seg(t, tBtn, tBtn + 0.5, easeOutBack));
  const btnPulse = useTransform(T, (t) => 1 + 0.025 * Math.sin((t - tBtn - 0.55) * 5.2) * (t > tBtn + 0.55 ? 1 : 0));
  const urlO = useTransform(T, (t) => seg(t, tUrl, tUrl + 0.4));
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingBottom: 120 }}>
      <motion.div style={{ opacity: wmO, y: wmY, textAlign: "center", position: "relative" }}>
        <img src="brand/logo.png" style={{ width: 780, display: "block", filter: "drop-shadow(0 10px 40px rgba(0,0,0,.55))" }} />
      </motion.div>
      <motion.div style={{ ...SUB, fontSize: (tagline || "").length > 42 ? 38 : 46, lineHeight: 1.25, maxWidth: 900, textAlign: "center", marginTop: 90, opacity: tagO, color: "#DCE8FF", fontWeight: 500 }}>
        {tagline}
      </motion.div>
      <motion.div style={{ scale: btnPulse, marginTop: 46 }}>
        <motion.div style={{ padding: "30px 74px", borderRadius: 100, background: ACCENT, opacity: btnO, scale: btnS, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 54, color: "#fff", boxShadow: `0 0 90px ${ACCENT}88, 0 14px 50px rgba(0,0,0,.5)` }}>
          {cta}
        </motion.div>
      </motion.div>
      <motion.div style={{ ...SUB, fontSize: 38, marginTop: 54, opacity: urlO, color: "#9FB6DC", fontWeight: 400, letterSpacing: "0.04em" }}>
        kaizenaiconsulting.com
      </motion.div>
    </div>
  );
}

export function Watermark({ tIn, tOut }) {
  const o = useTransform(T, (t) => 0.55 * seg(t, tIn, tIn + 0.5) * (1 - seg(t, tOut, tOut + 0.4)));
  return (
    <motion.img src="brand/logo_small.png" style={{ position: "absolute", top: 180, left: 64, width: 110, opacity: o, filter: "drop-shadow(0 4px 18px rgba(0,0,0,.5))" }} />
  );
}
