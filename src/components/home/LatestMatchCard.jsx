import { FMT, formResult, formColor } from "../../lib/constants.js";

/**
 * LatestMatchCard — Sprint 39 refaktorering.
 * Visar senaste matchen: motståndare, datum, resultat-badge,
 * målskyttar, lagmål och spelarbyten.
 *
 * Props:
 *   latestMatch — match-objekt (eller null/undefined → renderar inget)
 */
export default function LatestMatchCard({ latestMatch }) {
  if (!latestMatch) return null;

  const goalScorers = (latestMatch.scorers || []).filter(s =>
    typeof s === "object" ? s.type === "goal" : true
  );
  const teamGoals = latestMatch.teamGoals || [];
  const subs = latestMatch.substitutions || [];

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>SENASTE MATCH</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 2 }}>vs {latestMatch.opponent}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>{FMT(latestMatch.date)}</div>
        </div>
        {latestMatch.result && (() => {
          const res = formResult(latestMatch);
          const col = formColor(res);
          return (
            <div style={{ fontSize: 22, fontWeight: 900, color: col, background: col + "15", border: "1px solid " + col + "35", borderRadius: 12, padding: "6px 14px" }}>
              {latestMatch.result.us}-{latestMatch.result.them}
            </div>
          );
        })()}
      </div>

      {goalScorers.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
          {goalScorers.map((s, i) => (
            <span key={i} style={{ fontSize: 11, color: "#fbbf24", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 99, padding: "2px 10px" }}>
              ⚽ {typeof s === "object" ? s.name : s}
            </span>
          ))}
        </div>
      )}

      {teamGoals.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
          {teamGoals.map((g, gi) => {
            const done = (latestMatch.checked_goals || []).includes(gi);
            return (
              <span key={gi} style={{ fontSize: 10, color: done ? "#22c55e" : "#475569", background: done ? "rgba(34,197,94,0.07)" : "rgba(255,255,255,0.03)", border: "1px solid " + (done ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)"), borderRadius: 99, padding: "2px 8px" }}>
                {done ? "✓ " : "○ "}{g}
              </span>
            );
          })}
        </div>
      )}

      {subs.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
          {subs.map((sub, si) => (
            <span key={si} style={{ fontSize: 10, color: "#94a3b8", background: "rgba(148,163,184,0.07)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 99, padding: "2px 8px" }}>
              🔄 {sub.outName} → {sub.inName}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
