import { FMT, GROUPS, GC, FONT } from "../../lib/constants.js";

/**
 * MatchSquadSection — steg 2 av 3: truppen (Sprint 69, omskriven).
 * Inverterat val: alla friska spelare förväljs när steget öppnas (sköts i
 * MatchContent) — Andreas BOCKAR AV de som saknas i stället för att välja alla.
 * Match-info (motståndare/datum/serie) flyttad till MatchSetupStep,
 * cup-läge + lagmål bakom "Fler alternativ" i samma steg.
 *
 * Props: selected/setSelected/toggleSelected, goalkeeper/setGoalkeeper,
 *        gkPlayers, field, opponent, matchDate, serie, onNext
 */
export default function MatchSquadSection({
  selected, setSelected, toggleSelected,
  goalkeeper, setGoalkeeper,
  gkPlayers, field,
  opponent, matchDate, serie,
  onNext,
}) {
  const isInjured = (p) => (p.note && p.note?.startsWith("⚠")) || p.fitness === "injured";
  const fit = field.filter(p => !isInjured(p));
  const ready = selected.size > 0;

  return (
    <div>
      {/* Sammanfattning från steg 1 — cupdag saknar motståndare (fylls i per match) */}
      <div style={{ fontSize: FONT.body, color: "#94a3b8", marginBottom: 14 }}>
        {opponent.trim()
          ? <>vs <span style={{ color: "#fff", fontWeight: 800 }}>{opponent}</span> · {FMT(matchDate)} · {serie}</>
          : <><span style={{ color: "#fbbf24", fontWeight: 800 }}>🏆 Cupdag</span> · {FMT(matchDate)} — motståndare fylls i per match</>}
      </div>

      {/* Målvakt */}
      <div style={{ fontSize: FONT.label, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>MÅLVAKT</div>
      <div style={{ display: "flex", gap: 7, marginBottom: 16 }}>
        {gkPlayers.map(p => {
          const on = (goalkeeper || []).includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => setGoalkeeper(g => g.includes(p.id) ? g.filter(x => x !== p.id) : [...g, p.id])}
              style={{ padding: "10px 18px", minHeight: 44, border: "1.5px solid " + (on ? GC.MV.color : "rgba(255,255,255,0.08)"), borderRadius: 99, background: on ? GC.MV.bg : "transparent", color: on ? GC.MV.color : "#64748b", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {/* Utespelare — inverterat: bocka av de som saknas */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontSize: FONT.label, color: "#64748b", fontWeight: 700 }}>
          UTESPELARE — {selected.size} AV {field.length} MED
        </div>
      </div>
      <div style={{ fontSize: FONT.label, color: "#4a5568", marginBottom: 10 }}>
        Alla är förvalda — tryck bort de som saknas
      </div>

      {/* Stora snabbknappar (44px) */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setSelected(new Set(fit.map(p => p.id)))}
          style={{ flex: 1, padding: "11px 0", minHeight: 44, border: "1px solid rgba(34,197,94,0.3)", borderRadius: 12, background: "rgba(34,197,94,0.06)", color: "#22c55e", fontSize: FONT.body, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
        >
          Välj alla friska
        </button>
        <button
          onClick={() => setSelected(new Set())}
          style={{ flex: 1, padding: "11px 0", minHeight: 44, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, background: "transparent", color: "#64748b", fontSize: FONT.body, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
        >
          Rensa
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
                const inj = isInjured(p);
                const ltd = !inj && p.fitness === "limited";
                return (
                  <button
                    key={p.id}
                    onClick={() => !inj && toggleSelected(p.id)}
                    style={{
                      padding: "9px 15px",
                      minHeight: 40,
                      border: "1.5px solid " + (on ? GC[g].color : inj ? "rgba(255,80,80,0.3)" : ltd ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.08)"),
                      borderRadius: 99,
                      background: on ? GC[g].bg : inj ? "rgba(255,80,80,0.05)" : ltd ? "rgba(251,191,36,0.05)" : "transparent",
                      color: on ? GC[g].color : inj ? "rgba(255,80,80,0.4)" : ltd ? "#fbbf24" : "#64748b",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      cursor: inj ? "not-allowed" : "pointer",
                      opacity: inj ? 0.6 : 1,
                      textDecoration: !on && !inj ? "line-through" : "none",
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

      {/* Vidare */}
      <button
        onClick={() => ready && onNext()}
        disabled={!ready}
        style={{ width: "100%", padding: "15px 0", marginTop: 14, border: "none", borderRadius: 14, background: ready ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(255,255,255,0.05)", color: ready ? "#fff" : "#475569", fontSize: FONT.title, fontWeight: 900, fontFamily: "inherit", cursor: ready ? "pointer" : "not-allowed" }}
      >
        {ready ? "Vidare → Kedjor" : "Välj minst en spelare ↑"}
      </button>
    </div>
  );
}
