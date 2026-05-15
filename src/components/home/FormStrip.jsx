// src/components/home/FormStrip.jsx
// Sprint 41 — extraherad från HomeContent.jsx.
// Visar senaste 5 matchernas form (V/O/F) + kort score/motståndarstump.
// Sprint 41 feature: aggregerad målskillnad-indikator under formraden.
import { formResult, formColor } from "../../lib/constants.js";

/**
 * FormStrip — senaste 5 matcherna som färgade rutor.
 * Tomma celler renderas streckade om historiken är kortare än 5.
 *
 * Props:
 *   history — array av match-objekt (newest first).
 */
export default function FormStrip({ history }) {
  if (!history || history.length === 0) return null;

  const visible = history.slice(0, 5);

  // Aggregerad målskillnad över de visade matcherna (sprint 41 feature).
  // Endast matcher med kompletta resultat räknas.
  let goalDiff = 0;
  let scoredMatches = 0;
  for (const m of visible) {
    const us   = parseInt(m.result?.us);
    const them = parseInt(m.result?.them);
    if (Number.isNaN(us) || Number.isNaN(them) || m.result?.us === "" || m.result?.them === "") continue;
    goalDiff += (us - them);
    scoredMatches++;
  }
  const diffColor = goalDiff > 0 ? "#22c55e" : goalDiff < 0 ? "#f87171" : "#94a3b8";
  const diffSign  = goalDiff > 0 ? "+" : goalDiff < 0 ? "−" : "±";
  const diffLabel = `${diffSign}${Math.abs(goalDiff)}`;

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 14px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>SENASTE FORM</div>
        {scoredMatches > 0 && (
          <div
            title={`Aggregerad målskillnad över senaste ${scoredMatches} matcher`}
            aria-label={`Målskillnad ${diffLabel} över senaste ${scoredMatches} matcher`}
            style={{ fontSize: 10, fontWeight: 800, color: diffColor, letterSpacing: "0.04em" }}
          >
            MÅLSKILLNAD <span style={{ fontSize: 12, marginLeft: 4 }}>{diffLabel}</span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {visible.map((m, i) => {
          const res = formResult(m);
          const col = formColor(res);
          return (
            <div key={m.id || i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ width: "100%", height: 36, borderRadius: 10, background: res ? col + "18" : "rgba(255,255,255,0.02)", border: "1.5px " + (res ? "solid" : "dashed") + " " + col, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: col }}>
                {res || "–"}
              </div>
              <div style={{ fontSize: 8, color: "#475569", textAlign: "center" }}>
                {m.result?.us !== "" && m.result?.them !== "" ? `${m.result.us}-${m.result.them}` : m.opponent?.slice(0, 5) || ""}
              </div>
            </div>
          );
        })}
        {visible.length < 5 && Array.from({ length: 5 - visible.length }).map((_, i) => (
          <div key={"e" + i} style={{ flex: 1, height: 36, borderRadius: 10, border: "1.5px dashed rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }} />
        ))}
      </div>
    </div>
  );
}
