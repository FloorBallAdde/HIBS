import { useCallback, useState } from "react";
import { FMT, SERIES, GROUPS, GC, gc, mkLine } from "../../lib/constants.js";
import StableInput from "../ui/StableInput.jsx";
import FormationCard from "./FormationCard.jsx";
import { useTouchSwap } from "../../hooks/useTouchSwap.js";

/**
 * MatchContent — hanterar matchflödet: trupp → kedjor → live match.
 * Extraherad från App.jsx i Sprint 2.
 */
export default function MatchContent({
  activeMatch, matchStep, setMatchStep,
  matchResult, setMatchResult,
  matchScorers, setMatchScorers,
  confirmAbort, setConfirmAbort,
  lines, setLines, players, selected, setSelected,
  matchDate, setMatchDate, opponent, setOpponent,
  serie, setSerie, goalkeeper, setGoalkeeper,
  usedInLines, gkPlayers, field,
  startMatch, endMatch, abortMatch,
  assignSlot, removeSlot, renameLine, deleteLine, swapSlots,
  toggleSelected,
  teamGoals, setTeamGoals,
  saveError, setSaveError,
  upcomingMatches, loadFromSchedule,
}) {
  const [confirmNoLines, setConfirmNoLines] = useState(false);

  // Touch drag-and-drop: swap spelare mellan slots (inom och över linjer)
  const touchSwap = useTouchSwap({
    onSwap: useCallback(({ li: li1, pos: pos1 }, { li: li2, pos: pos2 }) => {
      if (li1 === li2 && pos1 === pos2) return; // samma slot, inget att göra
      swapSlots(li1, pos1, li2, pos2);
    }, [swapSlots]),
  });
  // ── LIVE MATCH ──
  if (activeMatch) return (
    <div>
      <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#22c55e" }}>LIVE - vs {activeMatch.opponent}</div>
          <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>{FMT(activeMatch.date)} - {activeMatch.serie}</div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{matchResult.us || 0}-{matchResult.them || 0}</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, marginBottom: 8 }}>HIBS</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <button onClick={() => setMatchResult(r => ({ ...r, us: Math.max(0, (parseInt(r.us) || 0) - 1) }))} style={{ width: 32, height: 32, border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 18, fontFamily: "inherit", cursor: "pointer" }}>-</button>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#fff", minWidth: 32, textAlign: "center" }}>{matchResult.us || 0}</span>
            <button onClick={() => setMatchResult(r => ({ ...r, us: (parseInt(r.us) || 0) + 1 }))} style={{ width: 32, height: 32, border: "none", borderRadius: "50%", background: "#22c55e", color: "#0b0d14", fontSize: 18, fontFamily: "inherit", cursor: "pointer", fontWeight: 700 }}>+</button>
          </div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#f87171", fontWeight: 700, marginBottom: 8 }}>MOT</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <button onClick={() => setMatchResult(r => ({ ...r, them: Math.max(0, (parseInt(r.them) || 0) - 1) }))} style={{ width: 32, height: 32, border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 18, fontFamily: "inherit", cursor: "pointer" }}>-</button>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#fff", minWidth: 32, textAlign: "center" }}>{matchResult.them || 0}</span>
            <button onClick={() => setMatchResult(r => ({ ...r, them: (parseInt(r.them) || 0) + 1 }))} style={{ width: 32, height: 32, border: "none", borderRadius: "50%", background: "#f87171", color: "#fff", fontSize: 18, fontFamily: "inherit", cursor: "pointer", fontWeight: 700 }}>+</button>
          </div>
        </div>
      </div>
      {activeMatch.teamGoals?.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: "#4a5568", fontWeight: 700, marginBottom: 6 }}>LAGMÅL</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {activeMatch.teamGoals.map((g, i) => (
              <span key={i} style={{ padding: "4px 10px", borderRadius: 99, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", fontSize: 12, fontWeight: 600 }}>{g}</span>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700, marginBottom: 8 }}>MÅL</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {players.filter(p => (activeMatch.players || []).includes(p.id) || (activeMatch.goalkeeper || []).includes(p.id)).map(p => {
              const cnt = matchScorers.filter(s => s.name === p.name && s.type === "goal").length;
              return (
                <button key={p.id} onClick={() => { setMatchScorers(s => [...s, { name: p.name, type: "goal" }]); setMatchResult(r => ({ ...r, us: (parseInt(r.us) || 0) + 1 })); }} style={{ padding: "6px 12px", border: "1px solid " + (cnt > 0 ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.07)"), borderRadius: 99, background: cnt > 0 ? "rgba(251,191,36,0.1)" : "transparent", color: cnt > 0 ? "#fbbf24" : "#4a5568", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                  {p.name}{cnt > 0 ? " (" + cnt + ")" : ""}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "#38bdf8", fontWeight: 700, marginBottom: 8 }}>ASSIST</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {players.filter(p => (activeMatch.players || []).includes(p.id) || (activeMatch.goalkeeper || []).includes(p.id)).map(p => {
              const cnt = matchScorers.filter(s => s.name === p.name && s.type === "assist").length;
              return (
                <button key={p.id} onClick={() => setMatchScorers(s => [...s, { name: p.name, type: "assist" }])} style={{ padding: "6px 12px", border: "1px solid " + (cnt > 0 ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.07)"), borderRadius: 99, background: cnt > 0 ? "rgba(56,189,248,0.1)" : "transparent", color: cnt > 0 ? "#38bdf8" : "#4a5568", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                  {p.name}{cnt > 0 ? " (" + cnt + ")" : ""}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {matchScorers.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <button onClick={() => {
            const last = matchScorers[matchScorers.length - 1];
            if (last?.type === "goal") setMatchResult(r => ({ ...r, us: Math.max(0, (parseInt(r.us) || 0) - 1) }));
            setMatchScorers(s => s.slice(0, -1));
          }} style={{ padding: "8px 16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 99, background: "transparent", color: "#4a5568", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Ångra senaste</button>
        </div>
      )}
      {saveError && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#f87171" }}>
          ⚠ {saveError}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={endMatch} style={{ flex: 2, padding: "15px 0", border: "none", borderRadius: 14, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 15, fontWeight: 900, fontFamily: "inherit", cursor: "pointer" }}>Avsluta match</button>
        <button onClick={() => setConfirmAbort(true)} style={{ flex: 1, padding: "15px 0", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 14, background: "transparent", color: "#f87171", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Avbryt</button>
      </div>
      {confirmAbort && (
        <div onClick={() => setConfirmAbort(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 360 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Avbryta matchen?</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>Resultat och målgörare sparas inte.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmAbort(false)} style={{ flex: 1, padding: "12px 0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "transparent", color: "#4a5568", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>Fortsätt</button>
              <button onClick={abortMatch} style={{ flex: 2, padding: "12px 0", border: "none", borderRadius: 12, background: "#f87171", color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>Ja avbryt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── KEDJOR (LINEUP) ──
  if (matchStep === "lines") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Kedjor</div>
        <button onClick={() => setMatchStep("select")} style={{ fontSize: 12, color: "#4a5568", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Tillbaka</button>
      </div>
      {lines.map((line, li) => (
        <FormationCard key={line.id} line={line} lineIndex={li} allPlayers={players.filter(p => selected.has(p.id))} usedIds={usedInLines} onAssign={assignSlot} onRemove={removeSlot} onRename={renameLine} onDelete={deleteLine} touchSwap={touchSwap} />
      ))}
      <button onClick={() => setLines(ls2 => [...ls2, mkLine(ls2.length + 1)])} style={{ width: "100%", padding: "12px 0", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 14, background: "transparent", color: "#4a5568", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginBottom: 14 }}>+ Ny linje</button>
      <button onClick={() => {
        if (usedInLines.size === 0) { setConfirmNoLines(true); return; }
        startMatch();
      }} style={{ width: "100%", padding: "15px 0", border: "none", borderRadius: 14, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 15, fontWeight: 900, fontFamily: "inherit", cursor: "pointer" }}>Starta match</button>
    </div>
  );

  // ── TRUPP (SELECT SQUAD) ──
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 16 }}>Trupp</div>

      {/* FRÅN SCHEMA — snabbval från kommande matcher */}
      {upcomingMatches && upcomingMatches.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 6 }}>FRÅN SCHEMA</div>
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

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "10px 12px", fontFamily: "inherit", outline: "none", colorScheme: "dark" }} />
        <StableInput value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="Motståndare" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "10px 12px", fontFamily: "inherit", outline: "none" }} />
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {SERIES.map(s => <button key={s} onClick={() => setSerie(s)} style={{ flex: 1, padding: "8px 0", border: "1px solid " + (serie === s ? "#f472b6" : "rgba(255,255,255,0.07)"), borderRadius: 8, background: serie === s ? "rgba(244,114,182,0.1)" : "transparent", color: serie === s ? "#f472b6" : "#4a5568", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>{s}</button>)}
      </div>
      <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 8 }}>VÄLJ MÅLVAKT</div>
      <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
        {gkPlayers.map(p => { const on = (goalkeeper || []).includes(p.id); return (
          <button key={p.id} onClick={() => setGoalkeeper(g => g.includes(p.id) ? g.filter(x => x !== p.id) : [...g, p.id])} style={{ padding: "8px 16px", border: "1.5px solid " + (on ? GC.MV.color : "rgba(255,255,255,0.08)"), borderRadius: 99, background: on ? GC.MV.bg : "transparent", color: on ? GC.MV.color : "#4a5568", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>{p.name}</button>
        ); })}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700 }}>VÄLJ UTESPELARE ({selected.size} valda)</div>
        <button onClick={() => setSelected(s => s.size >= field.length ? new Set() : new Set(field.map(x => x.id)))} style={{ fontSize: 10, color: "#22c55e", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>{selected.size >= field.length ? "Rensa" : "Välj alla"}</button>
      </div>
      {GROUPS.map(g => { const gp = field.filter(p => p.group === g); if (!gp.length) return null; return (
        <div key={g} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: GC[g].color, fontWeight: 700, marginBottom: 5 }}>GRUPP {g}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {gp.map(p => { const on = selected.has(p.id); const inj = p.note && p.note?.startsWith("⚠"); return (
              <button key={p.id} onClick={() => !inj && toggleSelected(p.id)} style={{ padding: "7px 14px", border: "1.5px solid " + (on ? GC[g].color : inj ? "rgba(255,80,80,0.3)" : "rgba(255,255,255,0.08)"), borderRadius: 99, background: on ? GC[g].bg : inj ? "rgba(255,80,80,0.05)" : "transparent", color: on ? GC[g].color : inj ? "rgba(255,80,80,0.4)" : "#4a5568", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: inj ? "not-allowed" : "pointer" }}>{p.name}{inj ? " ⚠" : ""}</button>
            ); })}
          </div>
        </div>
      ); })}
      <div style={{ marginTop: 16, marginBottom: 2 }}>
        <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 8 }}>LAGMÅL (valfritt)</div>
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
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={() => { if (selected.size > 0 && opponent.trim()) setMatchStep("lines"); }} disabled={selected.size === 0 || !opponent.trim()} style={{ flex: 1, padding: "14px 0", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 14, background: "rgba(167,139,250,0.08)", color: selected.size > 0 && opponent.trim() ? "#a78bfa" : "#334155", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: selected.size > 0 && opponent.trim() ? "pointer" : "not-allowed" }}>Kedjor</button>
        <button
          onClick={() => {
            if (!selected.size || !opponent.trim()) return;
            if (usedInLines.size === 0) { setConfirmNoLines(true); return; }
            startMatch();
          }}
          disabled={selected.size === 0 || !opponent.trim()}
          style={{ flex: 2, padding: "14px 0", border: "none", borderRadius: 14, background: selected.size > 0 && opponent.trim() ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(255,255,255,0.05)", color: selected.size > 0 && opponent.trim() ? "#fff" : "#334155", fontSize: 15, fontWeight: 900, fontFamily: "inherit", cursor: selected.size > 0 && opponent.trim() ? "pointer" : "not-allowed" }}
        >
          Starta match
        </button>
      </div>

      {confirmNoLines && (
        <div onClick={() => setConfirmNoLines(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 360 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Inga kedjor satta!</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>Du har inte satt upp kedjor för den här matchen. Vill du sätta kedjor eller starta ändå?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setConfirmNoLines(false); setMatchStep("lines"); }} style={{ flex: 1, padding: "13px 0", border: "1px solid rgba(167,139,250,0.4)", borderRadius: 12, background: "rgba(167,139,250,0.08)", color: "#a78bfa", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Sätt kedjor</button>
              <button onClick={() => { setConfirmNoLines(false); startMatch(); }} style={{ flex: 1, padding: "13px 0", border: "none", borderRadius: 12, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>Starta ändå</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
