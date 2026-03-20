import { useCallback, useState } from "react";
import { mkLine, FONT } from "../../lib/constants.js";
import StableInput from "../ui/StableInput.jsx";
import FormationCard from "./FormationCard.jsx";
import LiveMatchView from "./LiveMatchView.jsx";
import MatchSquadSection from "./MatchSquadSection.jsx";
import { useTouchSwap } from "../../hooks/useTouchSwap.js";

/**
 * MatchContent — hanterar matchflödet: trupp → kedjor → live match.
 * Sprint 9: Live-vy extraherad till LiveMatchView. Cup Mode tillagt.
 * Sprint 16: Trupp-vy extraherad till MatchSquadSection. Spelarbyten tillagt i LiveMatchView.
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
  reserves, setReserves,
  substitutions, makeSubstitution,
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
      reserves={reserves}
      substitutions={substitutions}
      makeSubstitution={makeSubstitution}
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
          <div style={{ fontSize: FONT.label, color: "#fbbf24", fontWeight: 700, marginBottom: 6 }}>
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
        <div style={{ fontSize: FONT.title, fontWeight: 900, color: "#fff" }}>Kedjor</div>
        <button
          onClick={() => setMatchStep("select")}
          style={{ fontSize: 12, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
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
          color: "#64748b",
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
            fontSize: FONT.title,
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
          className="hibs-overlay"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="hibs-dialog"
            style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 360 }}
          >
            <div style={{ fontSize: FONT.title, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Inga kedjor satta!</div>
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

  // ── TRUPP (SELECT SQUAD) — delegerat till MatchSquadSection ──
  return (
    <>
      <MatchSquadSection
        selected={selected}
        setSelected={setSelected}
        toggleSelected={toggleSelected}
        opponent={opponent}
        setOpponent={setOpponent}
        matchDate={matchDate}
        setMatchDate={setMatchDate}
        serie={serie}
        setSerie={setSerie}
        goalkeeper={goalkeeper}
        setGoalkeeper={setGoalkeeper}
        gkPlayers={gkPlayers}
        field={field}
        teamGoals={teamGoals}
        setTeamGoals={setTeamGoals}
        upcomingMatches={upcomingMatches}
        loadFromSchedule={loadFromSchedule}
        cupMode={cupMode}
        setCupMode={setCupMode}
        usedInLines={usedInLines}
        setMatchStep={setMatchStep}
        startMatch={startMatch}
        onConfirmNoLines={() => setConfirmNoLines(true)}
      />

      {confirmNoLines && (
        <div
          onClick={() => setConfirmNoLines(false)}
          className="hibs-overlay"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="hibs-dialog"
            style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 360 }}
          >
            <div style={{ fontSize: FONT.title, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Inga kedjor satta!</div>
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
    </>
  );
}
