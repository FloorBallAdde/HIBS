import { useState } from "react";
import { SERIES, FONT } from "../../lib/constants.js";
import StableInput from "../ui/StableInput.jsx";

/**
 * MatchSetupStep — steg 1 av 3: motståndare, datum, serie (Sprint 69).
 * Cup-läge + lagmål ligger bakom "Fler alternativ" — kritiska flödet hålls kort.
 *
 * Props: opponent/setOpponent, matchDate/setMatchDate, serie/setSerie,
 *        cupMode/setCupMode, teamGoals/setTeamGoals, onNext
 */
export default function MatchSetupStep({
  opponent, setOpponent,
  matchDate, setMatchDate,
  serie, setSerie,
  cupMode, setCupMode,
  teamGoals, setTeamGoals,
  onNext,
}) {
  const [showMore, setShowMore] = useState(false);
  const ready = opponent.trim().length > 0;

  return (
    <div>
      {/* Motståndare — det viktigaste, först och störst */}
      <div style={{ fontSize: FONT.label, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>MOTSTÅNDARE</div>
      <StableInput
        value={opponent}
        onChange={e => setOpponent(e.target.value)}
        placeholder="T.ex. Sirius IBK"
        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: FONT.title, fontWeight: 700, padding: "14px 14px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 }}
      />

      {/* Datum */}
      <div style={{ fontSize: FONT.label, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>DATUM</div>
      <input
        type="date"
        value={matchDate}
        onChange={e => setMatchDate(e.target.value)}
        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", fontSize: FONT.body, padding: "12px 14px", fontFamily: "inherit", outline: "none", colorScheme: "dark", boxSizing: "border-box", marginBottom: 12 }}
      />

      {/* Serie — minns senaste valet (persistas i hooken) */}
      <div style={{ fontSize: FONT.label, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>SERIE</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {SERIES.map(s => (
          <button key={s} onClick={() => setSerie(s)} style={{ flex: 1, padding: "11px 0", minHeight: 44, border: "1px solid " + (serie === s ? "#f472b6" : "rgba(255,255,255,0.07)"), borderRadius: 10, background: serie === s ? "rgba(244,114,182,0.1)" : "transparent", color: serie === s ? "#f472b6" : "#64748b", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Fler alternativ — cup-läge + lagmål */}
      <button
        onClick={() => setShowMore(m => !m)}
        style={{ width: "100%", padding: "12px 0", minHeight: 44, border: "none", background: "transparent", color: "#64748b", fontSize: FONT.body, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", textAlign: "left", marginBottom: showMore ? 8 : 4 }}
      >
        {showMore ? "▾" : "▸"} Fler alternativ {(cupMode || (teamGoals || []).some(g => g.trim())) && <span style={{ color: "#fbbf24" }}>·</span>}
      </button>

      {showMore && (
        <div style={{ marginBottom: 8 }}>
          {/* Cup-läge */}
          <button
            onClick={() => setCupMode(c => !c)}
            style={{ width: "100%", padding: "11px 14px", minHeight: 44, border: "1px solid " + (cupMode ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.07)"), borderRadius: 12, background: cupMode ? "rgba(251,191,36,0.07)" : "transparent", color: cupMode ? "#fbbf24" : "#64748b", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginBottom: 10, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}
          >
            <span>🏆</span>
            <span>{cupMode ? "Cup-läge aktivt — Trupp + Kedjor sparas mellan matcher" : "Cup-läge (turnering med flera matcher)"}</span>
            <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.6 }}>{cupMode ? "PÅ" : "AV"}</span>
          </button>

          {/* Lagmål */}
          <div style={{ fontSize: FONT.label, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>LAGMÅL (valfritt)</div>
          {(teamGoals || ["", "", ""]).map((goal, i) => (
            <StableInput
              key={i}
              value={goal}
              onChange={e => setTeamGoals(g => g.map((x, j) => j === i ? e.target.value : x))}
              placeholder={"Mål " + (i + 1) + " — t.ex. Pressa högt"}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: "#fff", fontSize: 12, padding: "9px 12px", fontFamily: "inherit", outline: "none", marginBottom: 6, boxSizing: "border-box" }}
            />
          ))}
        </div>
      )}

      {/* Vidare */}
      <button
        onClick={() => ready && onNext()}
        disabled={!ready}
        style={{ width: "100%", padding: "15px 0", marginTop: 8, border: "none", borderRadius: 14, background: ready ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(255,255,255,0.05)", color: ready ? "#fff" : "#475569", fontSize: FONT.title, fontWeight: 900, fontFamily: "inherit", cursor: ready ? "pointer" : "not-allowed" }}
      >
        {ready ? "Vidare → Trupp" : "Fyll i motståndare ↑"}
      </button>
    </div>
  );
}
