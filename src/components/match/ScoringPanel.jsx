import { FONT } from "../../lib/constants.js";

/**
 * ScoringPanel — mål/assist-registrering + händelselogg under live-match.
 * Extraherad från LiveMatchView i Sprint 65 (415→~300 rader).
 * Feature (Sprint 65): "↩ Ångra senaste"-genväg i loggens header — rättar
 * fingerfel direkt (ett tryck) utan att leta upp rätt rad i listan.
 * Värdefullt vid rinken: kalla händer, snabba registreringar, lätt att
 * mistrycka på fel spelare.
 */
export default function ScoringPanel({
  allMatchPlayers,
  matchScorers, setMatchScorers,
  matchResult, setMatchResult,
}) {
  const undoLast = () => {
    if (matchScorers.length === 0) return;
    const last = matchScorers[matchScorers.length - 1];
    if (last.type === "goal") {
      setMatchResult(r => ({ ...r, us: Math.max(0, (parseInt(r.us) || 0) - 1) }));
    }
    setMatchScorers(prev => prev.slice(0, -1));
  };

  return (
    <>
      {/* Målgörare + Assist */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: FONT.label, color: "#fbbf24", fontWeight: 700, marginBottom: 8 }}>MÅL</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {allMatchPlayers.map(p => {
              const cnt = matchScorers.filter(s => s.name === p.name && s.type === "goal").length;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setMatchScorers(s => [...s, { name: p.name, type: "goal" }]);
                    setMatchResult(r => ({ ...r, us: (parseInt(r.us) || 0) + 1 }));
                  }}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid " + (cnt > 0 ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.07)"),
                    borderRadius: 99,
                    background: cnt > 0 ? "rgba(251,191,36,0.1)" : "transparent",
                    color: cnt > 0 ? "#fbbf24" : "#64748b",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {p.name}{cnt > 0 ? ` (${cnt})` : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: FONT.label, color: "#38bdf8", fontWeight: 700, marginBottom: 8 }}>ASSIST</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {allMatchPlayers.map(p => {
              const cnt = matchScorers.filter(s => s.name === p.name && s.type === "assist").length;
              return (
                <button
                  key={p.id}
                  onClick={() => setMatchScorers(s => [...s, { name: p.name, type: "assist" }])}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid " + (cnt > 0 ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.07)"),
                    borderRadius: 99,
                    background: cnt > 0 ? "rgba(56,189,248,0.1)" : "transparent",
                    color: cnt > 0 ? "#38bdf8" : "#64748b",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {p.name}{cnt > 0 ? ` (${cnt})` : ""}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Händelselogg — tryck ✕ för att ta bort valfri händelse */}
      {matchScorers.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: FONT.label, color: "#64748b", fontWeight: 700, letterSpacing: "0.06em" }}>
              HÄNDELSELOGG — tryck ✕ för att ångra
            </div>
            <button
              onClick={undoLast}
              aria-label="Ångra senaste registrering"
              title="Ångra senaste registrering"
              style={{
                minHeight: 44,
                minWidth: 44,
                padding: "0 12px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                color: "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              ↩ Ångra senaste
            </button>
          </div>
          {[...matchScorers].reverse().map((s, ri) => {
            const origIdx = matchScorers.length - 1 - ri;
            const isGoal = s.type === "goal";
            return (
              <div
                key={origIdx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: isGoal ? "rgba(251,191,36,0.05)" : "rgba(56,189,248,0.04)",
                  border: "1px solid " + (isGoal ? "rgba(251,191,36,0.15)" : "rgba(56,189,248,0.12)"),
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 13, color: isGoal ? "#fbbf24" : "#38bdf8", fontWeight: 600 }}>
                  {isGoal ? "⚽" : "🎯"} {s.name}
                </span>
                <button
                  onClick={() => {
                    if (isGoal) setMatchResult(r => ({ ...r, us: Math.max(0, (parseInt(r.us) || 0) - 1) }));
                    setMatchScorers(prev => prev.filter((_, idx) => idx !== origIdx));
                  }}
                  style={{
                    background: "rgba(248,113,113,0.08)",
                    border: "1px solid rgba(248,113,113,0.2)",
                    borderRadius: 6,
                    color: "#f87171",
                    cursor: "pointer",
                    padding: "3px 8px",
                    fontSize: 13,
                    lineHeight: 1,
                    fontFamily: "inherit",
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
