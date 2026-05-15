/**
 * QuickStatsStrip — fyra mini-stat-kort i HomeContent.
 * Mål, assist, matcher, träningar. Sprint 40: extraherad från HomeContent.jsx.
 */
export default function QuickStatsStrip({ totalGoals, totalAssists, history, trainHistory }) {
  const stats = [
    { val: totalGoals,                 label: "MÅL",       color: "#fbbf24" },
    { val: totalAssists,               label: "ASSIST",    color: "#38bdf8" },
    { val: history.length,             label: "MATCHER",   color: "#a78bfa" },
    { val: trainHistory?.length || 0,  label: "TRÄNINGAR", color: "#34d399" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
      {stats.map(({ val, label, color }) => (
        <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 6px", textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginTop: 4, letterSpacing: "0.06em" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
