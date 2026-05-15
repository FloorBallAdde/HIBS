// src/components/home/LatestTrainings.jsx
// Sprint 43 — extraherad från HomeContent.jsx.
// Visar senaste 3 träningspass med datum, total_minutes och övningsnamn-chips.
// Sprint 43 feature: snitt-tid-indikator "SNITT X MIN" i headern,
// speglar samma header-mönster som FormStrip (S41) och TopScorers (S42).
import { FMT, FONT } from "../../lib/constants.js";

/**
 * LatestTrainings — senaste 3 träningspassen + snitt-tid-badge i headern.
 *
 * Props:
 *   trainHistory — array av { id, date, total_minutes, exercises[] } (newest first).
 *
 * Sprint 43 feature: snitt-tiden över de visade passen renderas som metric-badge i
 * headern. Samma flex-justify-between-layout som SENASTE FORM och SKYTTELIGA.
 * Färg: #a78bfa (samma lila som total_minutes per rad — visuell koppling).
 */
export default function LatestTrainings({ trainHistory }) {
  if (!trainHistory || trainHistory.length === 0) return null;

  const visible = trainHistory.slice(0, 3);

  // Snitt-tid över de visade passen (sprint 43 feature).
  // Endast pass med total_minutes > 0 räknas — ger Andreas intensitets-glance vid rinken.
  let totalMin = 0;
  let countedSessions = 0;
  for (const t of visible) {
    if (t.total_minutes && t.total_minutes > 0) {
      totalMin += t.total_minutes;
      countedSessions++;
    }
  }
  const avgMin = countedSessions > 0 ? Math.round(totalMin / countedSessions) : 0;
  const showAvg = countedSessions > 0 && avgMin > 0;

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>SENASTE TRÄNINGAR</div>
        {showAvg && (
          <div
            title={`Snitt-tid över senaste ${countedSessions} pass: ${avgMin} min`}
            aria-label={`Snitt-tid ${avgMin} minuter över senaste ${countedSessions} pass`}
            style={{ fontSize: 10, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.04em" }}
          >
            SNITT <span style={{ fontSize: 12, marginLeft: 4 }}>{avgMin} MIN</span>
          </div>
        )}
      </div>
      {visible.map((t, i) => (
        <div key={t.id || i} style={{
          display: "flex", alignItems: "center", gap: 10,
          paddingTop: i > 0 ? 9 : 0,
          marginTop: i > 0 ? 9 : 0,
          borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
        }}>
          <div style={{ minWidth: 54, flexShrink: 0 }}>
            <div style={{ fontSize: FONT.body, fontWeight: 700, color: "#fff" }}>{FMT(t.date)}</div>
            {t.total_minutes > 0 && (
              <div style={{ fontSize: FONT.label, color: "#a78bfa", fontWeight: 700, marginTop: 2 }}>{t.total_minutes} min</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {t.exercises?.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {t.exercises.slice(0, 3).map((ex, ei) => {
                  const name = typeof ex === "object" ? ex.name : ex;
                  return (
                    <span key={ei} style={{ fontSize: 10, color: "#38bdf8", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 99, padding: "2px 8px" }}>
                      {name}
                    </span>
                  );
                })}
                {t.exercises.length > 3 && (
                  <span style={{ fontSize: 10, color: "#64748b", padding: "2px 4px" }}>+{t.exercises.length - 3}</span>
                )}
              </div>
            ) : (
              <span style={{ fontSize: FONT.label, color: "#475569" }}>Inga övningar loggade</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
