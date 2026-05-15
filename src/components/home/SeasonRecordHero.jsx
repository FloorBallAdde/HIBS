// src/components/home/SeasonRecordHero.jsx
// Sprint 38 — extraherad från HomeContent.jsx.
// Visar säsongsrekord (V/O/F), vinstprocent-stapel och aktuell streak.
import { FONT, formResult, formColor } from "../../lib/constants.js";

export default function SeasonRecordHero({ history }) {
  const withRes = history.filter(m => formResult(m) !== null);
  if (withRes.length === 0) return null;

  const wins   = withRes.filter(m => formResult(m) === "V").length;
  const draws  = withRes.filter(m => formResult(m) === "O").length;
  const losses = withRes.filter(m => formResult(m) === "F").length;
  const winRate = Math.round(wins / withRes.length * 100);

  // Aktuell streak (samma resultat i rad från senaste matchen bakåt)
  const recentForms = history.slice(0, 10).map(m => formResult(m)).filter(Boolean);
  let streak = 0;
  const streakType = recentForms[0];
  if (streakType) {
    for (const r of recentForms) { if (r === streakType) streak++; else break; }
  }

  return (
    <div style={{
      background: "linear-gradient(135deg,rgba(34,197,94,0.12) 0%,rgba(22,163,74,0.05) 100%)",
      border: "1px solid rgba(34,197,94,0.18)",
      borderRadius: 20, padding: "18px 18px 16px", marginBottom: 12, position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -24, right: -24, width: 110, height: 110, borderRadius: "50%", background: "rgba(34,197,94,0.05)", pointerEvents: "none" }} />
      <div style={{ fontSize: 10, fontWeight: 800, color: "#22c55e", letterSpacing: "0.1em", marginBottom: 12 }}>
        SÄSONGEN {new Date().getFullYear()}
      </div>

      {/* Big W · D · L */}
      <div style={{ display: "flex", marginBottom: 14 }}>
        {[
          { val: wins,   label: "VINSTER",    color: "#22c55e" },
          { val: draws,  label: "OAVGJORDA",  color: "#fbbf24" },
          { val: losses, label: "FÖRLUSTER",  color: "#f87171" },
        ].map(({ val, label, color }, i) => (
          <div key={label} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <div style={{ fontSize: 44, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: FONT.label, fontWeight: 700, color, opacity: 0.65, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Win-rate bar */}
      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 7 }}>
        <div style={{ height: "100%", width: winRate + "%", background: "linear-gradient(90deg,#16a34a,#22c55e,#4ade80)", borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: "#64748b" }}>{withRes.length} matcher spelade</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#22c55e" }}>{winRate}% vinstprocent</div>
      </div>

      {/* Streak badge */}
      {streak >= 2 && (
        <div style={{ marginTop: 10, padding: "5px 12px", background: streakType === "V" ? "rgba(34,197,94,0.12)" : streakType === "F" ? "rgba(248,113,113,0.12)" : "rgba(251,191,36,0.12)", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 14 }}>{streakType === "V" ? "🔥" : streakType === "F" ? "❄️" : "〰️"}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: formColor(streakType) }}>
            {streak} {streakType === "V" ? "vinster" : streakType === "F" ? "förluster" : "oavgjorda"} i rad
          </span>
        </div>
      )}
    </div>
  );
}
