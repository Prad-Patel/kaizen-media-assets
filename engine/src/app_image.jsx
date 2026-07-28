import React from "react";
import { createRoot } from "react-dom/client";
import { ACCENT, TEAL, H, SUB } from "./shared.jsx";

// Static branded card for the WordPress featured image, Google Business and X.
// window.__CONFIG = { headline:[lines], kicker, tagline, width, height }
// Rendered as a single frame, so nothing here animates.
const C = window.__CONFIG;
const W = C.width || 1200;
const HGT = C.height || 630;
const S = W / 1200; // scale everything from the 1200x630 reference

function Background() {
  const parts = [];
  for (let i = 0; i < 34; i++) {
    parts.push({
      i,
      x: ((i * 733) % W),
      y: ((i * 419) % HGT),
      sz: (3 + ((i * 61) % 8)) * S,
      o: 0.18 + ((i * 37) % 24) / 100,
    });
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0A1628 0%, #0C1E38 48%, #081120 100%)" }}>
      <div style={{ position: "absolute", width: W * 1.1, height: W * 1.1, borderRadius: "50%", left: -W * 0.28, top: -HGT * 0.55, background: `radial-gradient(circle, rgba(46,124,246,0.22) 0%, rgba(46,124,246,0) 62%)` }} />
      <div style={{ position: "absolute", width: W * 0.85, height: W * 0.85, borderRadius: "50%", right: -W * 0.25, bottom: -HGT * 0.5, background: `radial-gradient(circle, rgba(52,211,166,0.12) 0%, rgba(52,211,166,0) 60%)` }} />
      {parts.map((p) => (
        <div key={p.i} style={{ position: "absolute", left: p.x, top: p.y, width: p.sz, height: p.sz, borderRadius: "50%", background: "#7FB0FF", filter: "blur(1px)", opacity: p.o }} />
      ))}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 120% 95% at 50% 45%, rgba(0,0,0,0) 52%, rgba(2,6,14,0.55) 100%)" }} />
    </div>
  );
}

function App() {
  const lines = C.headline || [];
  const base = lines.length > 2 ? 66 : 82;
  return (
    <div style={{ position: "relative", width: W, height: HGT, overflow: "hidden" }}>
      <Background />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: `0 ${86 * S}px` }}>
        {C.kicker && (
          <div style={{ ...SUB, fontSize: 26 * S, color: TEAL, letterSpacing: "0.26em", textIndent: "0.26em", marginBottom: 26 * S, fontWeight: 600 }}>
            {C.kicker.toUpperCase()}
          </div>
        )}
        {lines.map((line, i) => (
          <div key={i} style={{ ...H, fontSize: base * S, marginTop: i ? 10 * S : 0, color: i === lines.length - 1 && lines.length > 1 ? ACCENT : "#fff" }}>
            {line}
          </div>
        ))}
        {C.tagline && (
          <div style={{ ...SUB, fontSize: 30 * S, color: "#C6D6EF", marginTop: 34 * S, fontWeight: 400 }}>
            {C.tagline}
          </div>
        )}
      </div>
      <img src="brand/logo.png" style={{ position: "absolute", right: 74 * S, bottom: 54 * S, width: 250 * S, opacity: 0.95, filter: "drop-shadow(0 6px 24px rgba(0,0,0,.5))" }} />
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
