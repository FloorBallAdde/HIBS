import { FONT } from "../../lib/constants.js";

/**
 * KeeperStatsCard — Sprint 60: extraherad ur StatsContent.jsx.
 * Statelös presentationskomponent för målvaktsstatistik (MÅLVAKTSSTATISTIK-kortet).
 * Returnerar null när ingen keeper-data finns — guarden bor i komponenten.
 * Prop: keeperStats (array från useSeasonStats).
 */
export default function KeeperStatsCard({ keeperStats }) {
  if (!keeperStats || keeperStats.length === 0) return null;

  return (
    <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ fontSize: FONT.label, fontWeight: 800, color: "#a78bfa", marginBottom: 12 }}>🧤 MÅLVAKTSSTATISTIK</div>

      {/* Kolumnhuvud */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 8, borderBottom: "1px solid rgba(167,139,250,0.1)", marginBottom: 4 }}>
        <span style={{ flex: 1, fontSize: FONT.label, color: "#475569" }}>KEEPER</span>
        <span style={{ width: 28, textAlign: "center", fontSize: FONT.label, color: "#a78bfa" }}>MAT</span>
        <span style={{ width: 28, textAlign: "center", fontSize: FONT.label, color: "#f87171" }}>INS</span>
        <span style={{ width: 28, textAlign: "center", fontSize: FONT.label, color: "#22c55e" }}>RÄD</span>
        <span style={{ width: 32, textAlign: "center", fontSize: FONT.label, color: "#38bdf8" }}>%</span>
        <span style={{ width: 28, textAlign: "center", fontSize: FONT.label, color: "#fbbf24" }}>NOLL</span>
      </div>

      {keeperStats.map((k, i) => (
        <div key={k.name}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff" }}>{k.name}</span>
            <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#a78bfa", fontWeight: 700 }}>{k.matches}</span>
            <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#f87171" }}>{k.goalsAgainst}</span>
            <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#22c55e" }}>{k.saves}</span>
            <span style={{ width: 32, textAlign: "center", fontSize: 13, color: "#38bdf8", fontWeight: k.savePct !== null ? 700 : 400 }}>
              {k.savePct !== null ? k.savePct + "%" : "–"}
            </span>
            <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#fbbf24", fontWeight: 700 }}>{k.cleanSheets}</span>
          </div>
          {/* V/O/F + GAA */}
          <div style={{ display: "flex", gap: 10, padding: "4px 0 8px", borderBottom: i < keeperStats.length - 1 ? "1px solid rgba(167,139,250,0.08)" : "none" }}>
            <span style={{ fontSize: 11, color: "#22c55e" }}>{k.wins}V</span>
            <span style={{ fontSize: 11, color: "#fbbf24" }}>{k.draws}O</span>
            <span style={{ fontSize: 11, color: "#f87171" }}>{k.losses}F</span>
            {k.gaa !== null && (
              <span style={{ fontSize: 11, color: "#64748b", marginLeft: "auto" }}>GAA {k.gaa}</span>
            )}
            {k.shots === 0 && (
              <span style={{ fontSize: FONT.label, color: "#475569", marginLeft: "auto", fontStyle: "italic" }}>Skott ej trackade ännu</span>
            )}
          </div>
        </div>
      ))}

      <div style={{ fontSize: FONT.label, color: "#475569", marginTop: 6 }}>
        INS = insläppta · RÄD = räddningar · NOLL = nollor (clean sheets) · GAA = mål/match
      </div>
    </div>
  );
}
