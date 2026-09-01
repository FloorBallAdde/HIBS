import { FONT } from "../../lib/constants.js";

/**
 * MatchStepBar — stegindikator för matchflödet: 1 Match → 2 Trupp → 3 Kedjor.
 * Sprint 69. Ersätter SubTabBar + spridda Tillbaka-knappar (dubbel navigering).
 *
 * Props:
 *   current — "setup" | "select" | "lines"
 *   onStep  — (stepId) => void (anropas bara för tillåtna steg)
 *   canGo   — (stepId) => bool (styr vilka steg som är tappbara)
 *   onHome  — () => void (tillbaka till startvyn)
 */
const STEPS = [
  ["setup", "Match"],
  ["select", "Trupp"],
  ["lines", "Kedjor"],
];

export default function MatchStepBar({ current, onStep, canGo, onHome }) {
  const curIdx = STEPS.findIndex(([id]) => id === current);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
      <button
        onClick={onHome}
        aria-label="Tillbaka till matchstart"
        style={{ background: "none", border: "none", color: "#64748b", fontSize: 18, padding: "10px 10px 10px 0", minHeight: 44, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
      >
        ←
      </button>
      {STEPS.map(([id, label], i) => {
        const done = i < curIdx;
        const active = i === curIdx;
        const allowed = canGo(id);
        return (
          <button
            key={id}
            onClick={() => allowed && onStep(id)}
            disabled={!allowed}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 0",
              minHeight: 44,
              border: "none",
              borderBottom: "2px solid " + (active ? "#22c55e" : done ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.06)"),
              background: "transparent",
              color: active ? "#fff" : done ? "#22c55e" : allowed ? "#64748b" : "#374151",
              fontSize: 13,
              fontWeight: active ? 900 : 700,
              fontFamily: "inherit",
              cursor: allowed ? "pointer" : "default",
            }}
          >
            <span style={{
              width: 20, height: 20, borderRadius: "50%",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: FONT.label, fontWeight: 900,
              background: active ? "#22c55e" : done ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
              color: active ? "#0b0d14" : done ? "#22c55e" : "inherit",
              flexShrink: 0,
            }}>
              {done ? "✓" : i + 1}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
