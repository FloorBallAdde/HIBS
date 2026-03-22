import { FMT, SERIES, GROUPS, GC, FONT } from "../../lib/constants.js";
import StableInput from "../ui/StableInput.jsx";

/**
 * MatchSquadSection — trupp-valet (select squad) inför en match.
 * Extraherad från MatchContent i Sprint 16.
 * Hanterar: cup-mode toggle, schema-val, datum/motståndare, serie,
 *           målvakt, utespelare, lagmål, och navigering till kedjor/starta.
 */
export default function MatchSquadSection({
  selected, setSelected, toggleSelected,
  opponent, setOpponent,
  matchDate, setMatchDate,
  serie, setSerie,
  goalkeeper, setGoalkeeper,
  gkPlayers, field,
  teamGoals, setTeamGoals,
  upcomingMatches, loadFromSchedule,
  cupMode, setCupMode,
  usedInLines,
  setMatchStep, startMatch,
  onConfirmNoLines,
}) {
  return (
    <div>
      <div style={{ fontSize: FONT.title, fontWeight: 900, color: "#fff", marginBottom: 14 }}>Trupp</div>

      {/* Cup Mode toggle */}
      <button
        onClick={() => setCupMode(c => !c)}
        style={{
          width: "100%",
          padding: "11px 14px",
          border: "1px solid " + (cupMode ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.07)"),
          borderRadius: 12,
          background: cupMode ? "rgba(251,191,36,0.07)" : "transparent",
          color: cupMode ? "#fbbf24" : "#64748b",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: "pointer",
          marginBottom: 14,
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>🏆</span>
        <span>{cupMode ? "Cup-läge aktivt — Trupp + Kedjor sparas mellan matcher" : "Cup-läge (turnering med flera matcher)"}</span>
        <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.6 }}>{cupMode ? "PÅ" : "AV"}</span>
      </button>

      {/* Från schema */}
      {upcomingMatches && upcomingMatches.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: FONT.label, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>FRÅN SCHEMA</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {upcomingMatches.map(m => {
              const sc = m.serie === "14A" ? "#f472b6" : m.serie === "15A" ? "#38bdf8" : "#fbbf24";
              return (
                <button key={m.id} onClick={() => loadFromSchedule(m)} style={{ padding: "7px 14px", border: "1px solid " + sc + "50", borderRadius: 99, background: sc + "10", color: sc, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                  vs {m.opponent} · {FMT(m.date)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Datum + Motståndare */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="date"
          value={matchDate}
          onChange={e => setMatchDate(e.target.value)}
          style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "10px 12px", fontFamily: "inherit", outline: "none", colorScheme: "dark" }}
        />
        <StableInput
          value={opponent}
          onChange={e => setOpponent(e.target.value)}
          placeholder="Motståndare"
          style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "10px 12px", fontFamily: "inherit", outline: "none" }}
        />
      </div>

      {/* Serie */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {SERIES.map(s => (
          <button key={s} onClick={() => setSerie(s)} style={{ flex: 1, padding: "8px 0", border: "1px solid " + (serie === s ? "#f472b6" : "rgba(255,255,255,0.07)"), borderRadius: 8, background: serie === s ? "rgba(244,114,182,0.1)" : "transparent", color: serie === s ? "#f472b6" : "#64748b", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Välj målvakt */}
      <div style={{ fontSize: FONT.label, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>VÄLJ MÅLVAKT</div>
      <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
        {gkPlayers.map(p => {
          const on = (goalkeeper || []).includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => setGoalkeeper(g => g.includes(p.id) ? g.filter(x => x !== p.id) : [...g, p.id])}
              style={{ padding: "8px 16px", border: "1.5px solid " + (on ? GC.MV.color : "rgba(255,255,255,0.08)"), borderRadius: 99, background: on ? GC.MV.bg : "transparent", color: on ? GC.MV.color : "#64748b", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {/* Välj utespelare */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: FONT.label, color: "#64748b", fontWeight: 700 }}>VÄLJ UTESPELARE ({selected.size} valda)</div>
        <button
          onClick={() => setSelected(s => s.size >= field.length ? new Set() : new Set(field.map(x => x.id)))}
          style={{ fontSize: 10, color: "#22c55e", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          {selected.size >= field.length ? "Rensa" : "Välj alla"}
        </button>
      </div>

      {GROUPS.map(g => {
        const gp = field.filter(p => p.group === g);
        if (!gp.length) return null;
        return (
          <div key={g} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: FONT.label, color: GC[g].color, fontWeight: 700, marginBottom: 5 }}>GRUPP {g}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {gp.map(p => {
                const on = selected.has(p.id);
                const inj = (p.note && p.note?.startsWith("⚠")) || p.fitness === "injured";
                const ltd = !inj && p.fitness === "limited";
                return (
                  <button
                    key={p.id}
                    onClick={() => !inj && toggleSelected(p.id)}
                    style={{
                      padding: "7px 14px",
                      border: "1.5px solid " + (on ? GC[g].color : inj ? "rgba(255,80,80,0.3)" : ltd ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.08)"),
                      borderRadius: 99,
                      background: on ? GC[g].bg : inj ? "rgba(255,80,80,0.05)" : ltd ? "rgba(251,191,36,0.05)" : "transparent",
                      color: on ? GC[g].color : inj ? "rgba(255,80,80,0.4)" : ltd ? "#fbbf24" : "#64748b",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      cursor: inj ? "not-allowed" : "pointer",
                      opacity: inj ? 0.6 : 1,
                    }}
                  >
                    {p.name}{inj ? " 🤕" : ltd ? " ⚡" : ""}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Lagmål */}
      <div style={{ marginTop: 16, marginBottom: 2 }}>
        <div style={{ fontSize: FONT.label, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>LAGMÅL (valfritt)</div>
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

      {/* Kedjor / Starta match */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          onClick={() => { if (selected.size > 0 && opponent.trim()) setMatchStep("lines"); }}
          disabled={selected.size === 0 || !opponent.trim()}
          style={{ flex: 1, padding: "14px 0", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 14, background: "rgba(167,139,250,0.08)", color: selected.size > 0 && opponent.trim() ? "#a78bfa" : "#475569", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: selected.size > 0 && opponent.trim() ? "pointer" : "not-allowed" }}
        >
          Kedjor
        </button>
        <button
          onClick={() => {
            if (!selected.size || !opponent.trim()) return;
            if (usedInLines.size === 0) { onConfirmNoLines(); return; }
            startMatch();
          }}
          disabled={selected.size === 0 || !opponent.trim()}
          style={{ flex: 2, padding: "14px 0", border: "none", borderRadius: 14, background: selected.size > 0 && opponent.trim() ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(255,255,255,0.05)", color: selected.size > 0 && opponent.trim() ? "#fff" : "#475569", fontSize: FONT.title, fontWeight: 900, fontFamily: "inherit", cursor: selected.size > 0 && opponent.trim() ? "pointer" : "not-allowed" }}
        >
          Starta match
        </button>
      </div>
    </div>
  );
}
