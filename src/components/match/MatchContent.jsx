import { useCallback, useState } from "react";
import { mkLine, FONT } from "../../lib/constants.js";
import StableInput from "../ui/StableInput.jsx";
import FormationCard from "./FormationCard.jsx";
import LiveMatchView from "./LiveMatchView.jsx";
import MatchStartView from "./MatchStartView.jsx";
import MatchStepBar from "./MatchStepBar.jsx";
import MatchSetupStep from "./MatchSetupStep.jsx";
import MatchSquadSection from "./MatchSquadSection.jsx";
import { useTouchSwap } from "../../hooks/useTouchSwap.js";

/**
 * MatchContent — orkestrerar matchflödet (Sprint 69: steg-baserat).
 * start → setup (1 Match) → select (2 Trupp) → lines (3 Kedjor) → live.
 * Smarta defaults: alla friska förvalda i truppen, grundkedjor auto-laddas.
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
  setLineFormat, loadGrundkedjor,
  toggleSelected, teamGoals, setTeamGoals,
  saveError, setSaveError,
  matchShots, setMatchShots,
  matchShotsFor, setMatchShotsFor,
  upcomingMatches, loadFromSchedule,
  cupMode, setCupMode,
  substitutions, makeSubstitution,
  checkedGoals, toggleGoal,
}) {
  const [confirmNoLines, setConfirmNoLines] = useState(false);

  // Touch drag-and-drop swap
  const touchSwap = useTouchSwap({
    onSwap: useCallback(({ li: li1, pos: pos1 }, { li: li2, pos: pos2 }) => {
      if (li1 === li2 && pos1 === pos2) return;
      swapSlots(li1, pos1, li2, pos2);
    }, [swapSlots]),
  });

  // ── Steg-navigation med smarta defaults ──
  const isInjured = (p) => (p.note && p.note?.startsWith("⚠")) || p.fitness === "injured";

  // Inverterat truppval: förvälj alla friska utespelare
  const autoSelectAll = () => setSelected(new Set(field.filter(p => !isInjured(p)).map(p => p.id)));

  const goTrupp = () => {
    if (selected.size === 0) autoSelectAll();
    setMatchStep("select");
  };

  const goLines = () => {
    if (usedInLines.size === 0) loadGrundkedjor();
    setMatchStep("lines");
  };

  const onSchedule = (m) => {
    loadFromSchedule(m); // sätter motståndare/datum/serie + ev. RSVP-trupp, steg "select"
    if (!Array.isArray(m.rsvp) || m.rsvp.length === 0) autoSelectAll();
  };

  const canGo = (stepId) => {
    if (stepId === "setup") return true;
    if (stepId === "select") return opponent.trim().length > 0;
    return opponent.trim().length > 0 && selected.size > 0; // lines
  };

  const onStep = (stepId) => {
    if (stepId === "select") goTrupp();
    else if (stepId === "lines") goLines();
    else setMatchStep(stepId);
  };

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
      substitutions={substitutions}
      makeSubstitution={makeSubstitution}
      checkedGoals={checkedGoals}
      toggleGoal={toggleGoal}
    />
  );

  // ── STARTVY ──
  if (matchStep === "start" || (matchStep !== "setup" && matchStep !== "select" && matchStep !== "lines")) return (
    <MatchStartView
      upcomingMatches={upcomingMatches}
      cupMode={cupMode}
      onSchedule={onSchedule}
      onNew={() => setMatchStep("setup")}
      onCupContinue={() => setMatchStep("lines")}
    />
  );

  const stepBar = (
    <MatchStepBar
      current={matchStep}
      onStep={onStep}
      canGo={canGo}
      onHome={() => setMatchStep("start")}
    />
  );

  // ── STEG 1: MATCH ──
  if (matchStep === "setup") return (
    <div>
      {stepBar}
      <MatchSetupStep
        opponent={opponent} setOpponent={setOpponent}
        matchDate={matchDate} setMatchDate={setMatchDate}
        serie={serie} setSerie={setSerie}
        cupMode={cupMode} setCupMode={setCupMode}
        teamGoals={teamGoals} setTeamGoals={setTeamGoals}
        onNext={goTrupp}
      />
    </div>
  );

  // ── STEG 2: TRUPP ──
  if (matchStep === "select") return (
    <div>
      {stepBar}
      <MatchSquadSection
        selected={selected}
        setSelected={setSelected}
        toggleSelected={toggleSelected}
        goalkeeper={goalkeeper}
        setGoalkeeper={setGoalkeeper}
        gkPlayers={gkPlayers}
        field={field}
        opponent={opponent}
        matchDate={matchDate}
        serie={serie}
        onNext={goLines}
      />
    </div>
  );

  // ── STEG 3: KEDJOR ──
  return (
    <div>
      {stepBar}

      {/* Cup-läge: motståndare-input direkt här (trupp sparad, ny motståndare per match) */}
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

      {/* Ladda grundkedjor — fyller linorna med grunduppställningen ur vald trupp */}
      <button
        onClick={loadGrundkedjor}
        style={{
          width: "100%",
          padding: "13px 0",
          border: "1px solid rgba(167,139,250,0.35)",
          borderRadius: 14,
          background: "rgba(167,139,250,0.08)",
          color: "#a78bfa",
          fontSize: 13,
          fontWeight: 800,
          fontFamily: "inherit",
          cursor: "pointer",
          marginBottom: 12,
        }}
      >
        ⭐ Ladda om grundkedjor
      </button>

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
          onFormat={setLineFormat}
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
        + Ny lina
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
            color: (cupMode && !opponent.trim()) ? "#475569" : "#fff",
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
}
