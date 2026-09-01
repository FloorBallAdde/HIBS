import { FONT } from "../../lib/constants.js";

/**
 * MatchShotStats — skottstatistik-kort i live-matchvyn.
 * Extraherad från LiveMatchView i Sprint 59 (var en inline-IIFE sedan Sprint 9-eran).
 * Visar HIBS-skott + skottkonvertering och målvaktsräddningar + räddnings-%.
 * Härleder allt ur befintlig matchdata — ingen egen state, inga schema-ändringar.
 *
 * Sprint 59-feature: glance-rad "Skottövertag ±X" — tränaren ser direkt om laget
 * skjuter mer än motståndaren (rink-värde: kalla händer, glance-baserat).
 */
export default function MatchShotStats({
  players,
  activeMatch,
  matchResult,
  matchShots, setMatchShots,
  matchShotsFor, setMatchShotsFor,
}) {
  const keeperNames = players
    .filter(p => (activeMatch.goalkeeper || []).includes(p.id))
    .map(p => p.name);

  const goalsFor     = parseInt(matchResult.us)   || 0;
  const goalsAgainst = parseInt(matchResult.them) || 0;

  const sf = matchShotsFor || 0;
  const sa = matchShots    || 0;

  const shotConv = sf > 0 ? Math.round(goalsFor / sf * 100) : null;
  const savePct  = sa > 0 ? Math.round(Math.max(0, sa - goalsAgainst) / sa * 100) : null;
  const saves    = Math.max(0, sa - goalsAgainst);

  // Skottövertag — skillnaden mellan HIBS skott och skott mot. Glance-värde.
  const shotDiff = sf - sa;
  const hasShots = sf > 0 || sa > 0;
  const diffColor = shotDiff > 0 ? "#22c55e" : shotDiff < 0 ? "#f87171" : "#64748b";

  const BtnStyle = (color) => ({
    flex: 1, height: 56, border: "none", borderRadius: 12,
    background: color + "22", color, fontSize: 14, fontWeight: 900,
    fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.02em",
  });
  const UndoStyle = {
    width: 44, height: 44, border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, background: "rgba(255,255,255,0.03)", color: "#64748b",
    fontSize: 18, fontFamily: "inherit", cursor: "pointer", flexShrink: 0,
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px", marginBottom: 14 }}>
      <div style={{ fontSize: FONT.label, fontWeight: 800, color: "#64748b", marginBottom: 12, letterSpacing: "0.08em" }}>
        SKOTTSTATISTIK
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* HIBS — skott framåt */}
        <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.14)", borderRadius: 12, padding: "12px 10px" }}>
          <div style={{ fontSize: FONT.label, fontWeight: 800, color: "#22c55e", marginBottom: 6 }}>🏒 HIBS SKOTT</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#22c55e", lineHeight: 1, marginBottom: 2 }}>{sf}</div>
          {shotConv !== null
            ? <div style={{ fontSize: FONT.label, color: "#64748b", marginBottom: 10 }}>{goalsFor} mål · {shotConv}%</div>
            : <div style={{ fontSize: FONT.label, color: "#475569", marginBottom: 10 }}>{goalsFor} mål</div>
          }
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setMatchShotsFor(s => Math.max(0, s - 1))} style={UndoStyle}>−</button>
            <button onClick={() => setMatchShotsFor(s => s + 1)} style={BtnStyle("#22c55e")}>+ Skott</button>
          </div>
        </div>

        {/* KEEPER — skott mot */}
        <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.14)", borderRadius: 12, padding: "12px 10px" }}>
          <div style={{ fontSize: FONT.label, fontWeight: 800, color: "#a78bfa", marginBottom: 2 }}>🧤 RÄDDNINGAR</div>
          {keeperNames.length > 0 && (
            <div style={{ fontSize: FONT.label, color: "#64748b", marginBottom: 4 }}>{keeperNames.join(" / ")}</div>
          )}
          <div style={{ fontSize: 32, fontWeight: 900, color: "#a78bfa", lineHeight: 1, marginBottom: 2 }}>{saves}</div>
          {savePct !== null
            ? <div style={{ fontSize: FONT.label, color: "#64748b", marginBottom: 10 }}>{sa} skott · {savePct}%</div>
            : <div style={{ fontSize: FONT.label, color: "#475569", marginBottom: 10 }}>{goalsAgainst} insläppta</div>
          }
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setMatchShots(s => Math.max(0, s - 1))} style={UndoStyle}>−</button>
            <button onClick={() => setMatchShots(s => s + 1)} style={BtnStyle("#a78bfa")}>+ Skott</button>
          </div>
        </div>
      </div>

      {/* Skottövertag — glance-rad (Sprint 59). Härledd ur sf − sa. */}
      {hasShots && (
        <div style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: FONT.label,
          fontWeight: 700,
          color: "#64748b",
          letterSpacing: "0.04em",
        }}>
          <span>Skottövertag</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: diffColor }}>
            {shotDiff === 0 ? "jämnt" : shotDiff > 0 ? `+${shotDiff}` : shotDiff}
          </span>
          <span style={{ color: "#475569" }}>({sf}–{sa})</span>
        </div>
      )}
    </div>
  );
}
