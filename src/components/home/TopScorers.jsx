// src/components/home/TopScorers.jsx
// Sprint 42 — extraherad från HomeContent.jsx.
// Visar Top 3 poängplockare med medaljer, group color, M/A/P.
// Sprint 42 feature: koncentrationsindikator — "TOPP 3: X% AV MÅLEN" i headern,
// speglar samma header-mönster som FormStrip (Sprint 41).
import { GC, gc } from "../../lib/constants.js";

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * TopScorers — Top 3 poängplockare med koncentrationsbadge i headern.
 *
 * Props:
 *   stats   — array av { name, goals, assists, points } sorterad efter points (högst först).
 *             Hela laget skickas in så att vi kan beräkna lagets totala mål.
 *   players — array av { name, group } för group-color-doten.
 */
export default function TopScorers({ stats, players }) {
  if (!stats || stats.length === 0) return null;

  const top3 = stats.slice(0, 3);

  // Koncentrationsindikator (sprint 42 feature):
  // hur stor andel av lagets mål kommer från Top 3?
  let top3Goals = 0;
  let teamGoals = 0;
  for (const p of stats) {
    teamGoals += p.goals || 0;
  }
  for (const p of top3) {
    top3Goals += p.goals || 0;
  }
  const sharePct = teamGoals > 0 ? Math.round((top3Goals / teamGoals) * 100) : 0;
  const showShare = teamGoals > 0 && top3Goals > 0;

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>SKYTTELIGA</div>
        {showShare && (
          <div
            title={`Topp 3 har gjort ${top3Goals} av ${teamGoals} mål (${sharePct}%)`}
            aria-label={`Topp 3 står för ${sharePct} procent av lagets mål`}
            style={{ fontSize: 10, fontWeight: 800, color: "#fbbf24", letterSpacing: "0.04em" }}
          >
            TOPP 3 <span style={{ fontSize: 12, marginLeft: 4 }}>{sharePct}% AV MÅLEN</span>
          </div>
        )}
      </div>
      {top3.map((p, i) => {
        const player = players.find(x => x.name === p.name);
        const pgc = player ? gc(player.group) : GC._;
        return (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < top3.length - 1 ? 8 : 0 }}>
            <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{MEDALS[i]}</span>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: pgc.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", flex: 1 }}>{p.name}</span>
            <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>{p.goals}M</span>
            <span style={{ fontSize: 12, color: "#38bdf8" }}>{p.assists}A</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: "#22c55e", width: 22, textAlign: "right" }}>{p.points}P</span>
          </div>
        );
      })}
    </div>
  );
}
