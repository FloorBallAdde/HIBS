import { useCallback, useState } from "react";
import { FMT, SERIES, GROUPS, GC, gc, mkLine } from "../../lib/constants.js";
import StableInput from "../ui/StableInput.jsx";
import FormationCard from "./FormationCard.jsx";
import LiveMatchView from "./LiveMatchView.jsx";
import { useTouchSwap } from "../../hooks/useTouchSwap.js";

/**
 * MatchContent — hanterar matchflödet: trupp → kedjor → live match.
 * Sprint 9: Live-vy extraherad till LiveMatchView. Cup Mode tillagt.
 */
export default function MatchContent({
  activeMatch,
  matchStep, setMatchStep,
  matchResult, setMatchResult,
  matchScorers, setMatchScorers,
  confirmAbort, setConfirmAbort,
  lines, setLines,
  players, selected, setSelected,
  matchDate, setMatchDate,
  opponent, setOpponent,
  serie, setSerie,
  goalkeeper, setGoalkeeper,
  usedInLines, gkPlayers, field,
  startMatch, endMatch, abortMatch,
  assignSlot, removeSlot, renameLine, deleteLine, swapSlots,
  toggleSelected, teamGoals, setTeamGoals,
  saveError, setSaveError,
  matchShots, setMatchShots,
  matchShotsFor, setMatchShotsFor,
  upcomingMatches, loadFromSchedule,
  cupMode, setCupMode,
}) {
  const [confirmNoLines, setConfirmNoLines] = useState(false);

  // Touch drag-and-drop swap
  const touchSwap = useTouchSwap({
    onSwap: useCallback(({ li: li1, pos: pos1 }, { li: li2, pos: pos2 }) => {
      if (li1 === li2 && pos1 === pos2) return;
      swapSlots(li1, pos1, li2, pos2);
    }, [swapSlots]),
  });

  // ── LIVE MATCH → delegera till LiveMatchView ──
  if (activeMatch) return (
    <LiveMatchView
      activeMatch={activeMatch}
      matchResult={matchResult}
      setMatchResult={setMatchResult}
      matchScorers={matchScorers}
      setMatchScorers={setMatchScorers}
      confirmAbort={confirmAbort}
      setConfirmAbort={setConfirmAbort}
      players={players}
      endMatch={endMatch}
      abortMatch={abortMatch}
      saveError={saveError}
      matchShots={matchShots}
      setMatchShots={setMatchShots}
      matchShotsFor={matchShotsFor}
      setMatchShotsFor={setMatchShotsFor}
      cupMode={cupMode}
    />
  );

  // ── KEDJOR (LINEUP) ──
  if (matchStep === "lines") return (
    <div>
      {/* Cup-läge: motståndare-input + indikator direkt här */}
      {cupMode && (
        <div style={{
          background: "rgba(251,191,36,0.07)",
          border: "1px solid rgba(251,191,36,0.2)",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 9, color: "#fbbf24", fontWeight: 700, marginBottom: 6 }}>
            🏆 CUP-LÄGE — TRUPP SPARAD
          </div>
          <StableInput
            value={opponent}
            onChange={e => setOpponent(e.target.value)}
            placeholder="Motståndare (ny match)"
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(251,191,36,0.25)",
              borderRadius: 10,
              color: "#fff",
              fontSize: 13,
              padding: "10px 12px",
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Kedjor</div>
        <button
          onClick={() => setMatchStep("select")}
          style={{ fontSize: 12, color: "#4a5568", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          Tillbaka
        </button>
      </div>

      {lines.map((line, li) => (
        <FormationCard
          key={line.id}
          line={line}
          lineIndex={li}
          allPlayers={players.filter(p => selected.has(p.id))}
          usedIds={usedInLines}
          onAssign={assignSlot}
          onRemove={removeSlot}
          onRename={renameLine}
          onDelete={deleteLine}
          touchSwap={touchSwap}
        />
      ))}

      <button
        onClick={() => setLines(ls2 => [...ls2, mkLine(ls2.length + 1)])}
        style={{
          width: "100%",
          padding: "12px 0",
          border: "1px dashed rgba(255,255,255,0.1)",
          borderRadius: 14,
          background: "transparent",
          color: "#4a5568",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: "pointer",
          marginBottom: 8,
        }}
      >
        + Ny linje
      </button>

      {/* STICKY Starta match — alltid synlig ovanför bottenmenyn */}
      <div style={{ position: "sticky", bottom: 80, zIndex: 10, paddingTop: 8 }}>
        <button
          onClick={() => {
            if (usedInLines.size === 0) { setConfirmNoLines(true); return; }
            startMatch();
          }}
          disabled={cupMode && !opponent.trim()}
          style={{
            width: "100%",
            padding: "15px 0",
            border: "none",
            borderRadius: 14,
            background: (cupMode && !opponent.trim())
              ? "rgba(255,255,255,0.05)"
              : "linear-gradient(135deg,#22c55e,#16a34a)",
            color: (cupMode && !opponent.trim()) ? "#334155" : "#fff",
            fontSize: 15,
            fontWeight: 900,
            fontFamily: "inherit",
            cursor: (cupMode && !opponent.trim()) ? "not-allowed" : "pointer",
            boxShadow: "0 -8px 24px rgba(11,13,20,0.8)",
          }}
        >
          {cupMode && !opponent.trim() ? "Fyll i motståndare ↑" : "Starta match"}
        </button>
      </div>

      {/* Bekräfta inga kedjor */}
      {confirmNoLines && (
        <div
          onClick={() => setConfirmNoLines(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 360 }}
          >
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Inga kedjor satta!</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
              Du har inte satt upp kedjor för den här matchen. Vill du sätta kedjor eller starta ändå?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setConfirmNoLines(false)}
                style={{ flex: 1, padding: "13px 0", border: "1px solid rgba(167,139,250,0.4)", borderRadius: 12, background: "rgba(167,139,250,0.08)", color: "#a78bfa", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
              >
                Sätt kedjor
              </button>
              <button
                onClick={() => { setConfirmNoLines(false); startMatch(); }}
                style={{ flex: 1, padding: "13px 0", border: "none", borderRadius: 12, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}
              >
                Starta ändå
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── TRUPP (SELECT SQUAD) ──
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 14 }}>Trupp</div>

      {/* Cup Mode toggle */}
      <button
        onClick={() => setCupMode(c => !c)}
        style={{
          width: "100%",
          padding: "11px 14px",
          border: "1px solid " + (cupMode ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.07)"),
          borderRadius: 12,
          background: cupMode ? "rgba(251,191,36,0.07)" : "transparent",
          color: cupMode ? "#fbbf24" : "#4a5568",
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
          <button key={s} onClick={() => setSerie(s)} style={{ flex: 1, padding: "8px 0", border: "1px solid " + (serie === s ? "#f472b6" : "rgba(255,255,255,0.07)"), borderRadius: 8, background: serie === s ? "rgba(244,114,182,0.1)" : "transparent", color: serie === s ? "#f472b6" : "#4a5568", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Välj målvakt */}
      <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 8 }}>VÄLJ MÅLVAKT</div>
      <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
        {gkPlayers.map(p => {
          const on = (goalkeeper || []).includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => setGoalkeeper(g => g.includes(p.id) ? g.filter(x => x !== p.id) : [...g, p.id])}
              style={{ padding: "8px 16px", border: "1.5px solid " + (on ? GC.MV.color : "rgba(255,255,255,0.08)"), borderRadius: 99, background: on ? GC.MV.bg : "transparent", color: on ? GC.MV.color : "#4a5568", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {/* Välj utespelare */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700 }}>VÄLJ UTESPELARE ({selected.size} valda)</div>
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
            <div style={{ fontSize: 9, color: GC[g].color, fontWeight: 700, marginBottom: 5 }}>GRUPP {g}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {gp.map(p => {
                const on = selected.has(p.id);
                const inj = p.note && p.note?.startsWith("⚠");
                return (
                  <button
                    key={p.id}
                    onClick={() => !inj && toggleSelected(p.id)}
                    style={{ padding: "7px 14px", border: "1.5px solid " + (on ? GC[g].color : inj ? "rgba(255,80,80,0.3)" : "rgba(255,255,255,0.08)"), borderRadius: 99, background: on ? GC[g].bg : inj ? "rgba(255,80,80,0.05)" : "transparent", color: on ? GC[g].color : inj ? "rgba(255,80,80,0.4)" : "#4a5568", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: inj ? "not-allowed" : "pointer" }}
                  >
                    {p.name}{inj ? " ⚠" : ""}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Lagmål */}
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

      {/* Kedjor / Starta match */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          onClick={() => { if (selected.size > 0 && opponent.trim()) setMatchStep("lines"); }}
          disabled={selected.size === 0 || !opponent.trim()}
          style={{ flex: 1, padding: "14px 0", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 14, background: "rgba(167,139,250,0.08)", color: selected.size > 0 && opponent.trim() ? "#a78bfa" : "#334155", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: selected.size > 0 && opponent.trim() ? "pointer" : "not-allowed" }}
        >
          Kedjor
        </button>
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
        <div
          onClick={() => setConfirmNoLines(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 360 }}
          >
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Inga kedjor satta!</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
              Du har inte satt upp kedjor. Vill du sätta kedjor eller starta ändå?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setConfirmNoLines(false); setMatchStep("lines"); }} style={{ flex: 1, padding: "13px 0", border: "1px solid rgba(167,139,250,0.4)", borderRadius: 12, background: "rgba(167,139,250,0.08)", color: "#a78bfa", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                Sätt kedjor
              </button>
              <button onClick={() => { setConfirmNoLines(false); startMatch(); }} style={{ flex: 1, padding: "13px 0", border: "none", borderRadius: 12, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>
                Starta ändå
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
