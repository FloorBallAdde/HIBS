import { FMT, FONT } from "../../lib/constants.js";
import SubstitutionPanel from "./SubstitutionPanel.jsx";
import MatchShotStats from "./MatchShotStats.jsx";
import ScoringPanel from "./ScoringPanel.jsx";

/**
 * LiveMatchView — live-match-vy under pågående match.
 * Extraherad från MatchContent i Sprint 9.
 * Sprint 16: Spelarbyten (substitutions) — snabb swap av spelare under match.
 * Sprint 58: Spelarbyten utbrutna → SubstitutionPanel.jsx (egen UI-state).
 * Sprint 59: Skottstatistik utbruten → MatchShotStats.jsx (statelös presentation).
 * Sprint 65: Mål/assist/händelselogg utbrutna → ScoringPanel.jsx.
 * Hanterar: resultat, målgörare, assist, lagmål, skott, byten, avsluta/avbryt.
 */
export default function LiveMatchView({
  activeMatch,
  matchResult, setMatchResult,
  matchScorers, setMatchScorers,
  confirmAbort, setConfirmAbort,
  players,
  endMatch,
  abortMatch,
  saveError,
  matchShots, setMatchShots,
  matchShotsFor, setMatchShotsFor,
  cupMode,
  substitutions,
  makeSubstitution,
  checkedGoals,
  toggleGoal,
}) {
  const allMatchPlayers = players.filter(p =>
    (activeMatch.players || []).includes(p.id) ||
    (activeMatch.goalkeeper || []).includes(p.id)
  );

  // Lead-state-chip (Sprint 62): glance-läsbart matchläge ur befintligt resultat
  const usGoals = parseInt(matchResult.us) || 0;
  const themGoals = parseInt(matchResult.them) || 0;
  const goalDiff = usGoals - themGoals;
  const leadChip =
    goalDiff > 0
      ? { label: `Leder +${goalDiff}`, color: "#22c55e", bg: "rgba(34,197,94,0.14)" }
      : goalDiff < 0
      ? { label: `Under ${goalDiff}`, color: "#f87171", bg: "rgba(248,113,113,0.14)" }
      : { label: "Oavgjort", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };

  return (
    <div>
      {/* Cup-läge-indikator */}
      {cupMode && (
        <div style={{
          background: "rgba(251,191,36,0.07)",
          border: "1px solid rgba(251,191,36,0.2)",
          borderRadius: 10,
          padding: "7px 14px",
          marginBottom: 12,
          fontSize: FONT.label,
          color: "#fbbf24",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          🏆 Cup-läge — Trupp sparas till nästa match
        </div>
      )}

      {/* Match-header: motståndare + resultat */}
      <div style={{
        background: "rgba(34,197,94,0.08)",
        border: "1px solid rgba(34,197,94,0.2)",
        borderRadius: 14,
        padding: "12px 16px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#22c55e" }}>
            LIVE - vs {activeMatch.opponent}
          </div>
          <div style={{ fontSize: FONT.label, color: "#64748b", marginTop: 2 }}>
            {FMT(activeMatch.date)} · {activeMatch.serie}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
            {matchResult.us || 0}-{matchResult.them || 0}
          </div>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            color: leadChip.color,
            background: leadChip.bg,
            borderRadius: 99,
            padding: "3px 10px",
            letterSpacing: 0.2,
          }}>
            {leadChip.label}
          </div>
        </div>
      </div>

      {/* Resultat-knappar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "us", label: "HIBS", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
          { key: "them", label: "MOT", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
        ].map(({ key, label, color, bg }) => (
          <div key={key} style={{
            flex: 1,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: 14,
            textAlign: "center",
          }}>
            <div style={{ fontSize: FONT.label, color, fontWeight: 700, marginBottom: 8 }}>{label}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <button
                onClick={() => setMatchResult(r => ({ ...r, [key]: Math.max(0, (parseInt(r[key]) || 0) - 1) }))}
                style={{ width: 36, height: 36, border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 20, fontFamily: "inherit", cursor: "pointer" }}
              >-</button>
              <span style={{ fontSize: 32, fontWeight: 900, color: "#fff", minWidth: 32, textAlign: "center" }}>
                {matchResult[key] || 0}
              </span>
              <button
                onClick={() => setMatchResult(r => ({ ...r, [key]: (parseInt(r[key]) || 0) + 1 }))}
                style={{ width: 36, height: 36, border: "none", borderRadius: "50%", background: color, color: key === "us" ? "#0b0d14" : "#fff", fontSize: 20, fontFamily: "inherit", cursor: "pointer", fontWeight: 700 }}
              >+</button>
            </div>
          </div>
        ))}
      </div>

      {/* SKOTTSTATISTIK (utbruten Sprint 59) */}
      <MatchShotStats
        players={players}
        activeMatch={activeMatch}
        matchResult={matchResult}
        matchShots={matchShots}
        setMatchShots={setMatchShots}
        matchShotsFor={matchShotsFor}
        setMatchShotsFor={setMatchShotsFor}
      />

      {/* ── SPELARBYTEN (Sprint 16, utbruten Sprint 58) ─────────────────── */}
      <SubstitutionPanel
        activeMatch={activeMatch}
        players={players}
        substitutions={substitutions}
        makeSubstitution={makeSubstitution}
      />

      {/* Lagmål — interaktiva chips, tryck för att bocka av (Sprint 19) */}
      {activeMatch.teamGoals?.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: "10px 14px",
          marginBottom: 14,
        }}>
          <div style={{ fontSize: FONT.label, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>
            LAGMÅL — tryck för att bocka av
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {activeMatch.teamGoals.map((g, i) => {
              const done = checkedGoals?.has(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleGoal?.(i)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 99,
                    background: done ? "rgba(34,197,94,0.18)" : "rgba(34,197,94,0.06)",
                    border: "1.5px solid " + (done ? "rgba(34,197,94,0.5)" : "rgba(34,197,94,0.18)"),
                    color: done ? "#22c55e" : "#64748b",
                    fontSize: 12,
                    fontWeight: done ? 800 : 600,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    textDecoration: done ? "line-through" : "none",
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                >
                  {done && <span style={{ fontSize: 14 }}>✓</span>}
                  {g}
                </button>
              );
            })}
          </div>
          {/* Progress indicator */}
          {activeMatch.teamGoals.length > 0 && (
            <div style={{
              fontSize: FONT.label,
              color: "#64748b",
              marginTop: 8,
              fontWeight: 600,
            }}>
              {checkedGoals?.size || 0}/{activeMatch.teamGoals.length} avklarade
            </div>
          )}
        </div>
      )}

      {/* MÅL/ASSIST + HÄNDELSELOGG (utbrutna Sprint 65) */}
      <ScoringPanel
        allMatchPlayers={allMatchPlayers}
        matchScorers={matchScorers}
        setMatchScorers={setMatchScorers}
        matchResult={matchResult}
        setMatchResult={setMatchResult}
      />

      {/* Felmeddelande */}
      {saveError && (
        <div style={{
          background: "rgba(248,113,113,0.1)",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: 12,
          padding: "10px 14px",
          marginBottom: 12,
          fontSize: 12,
          color: "#f87171",
        }}>
          ⚠ {saveError}
        </div>
      )}

      {/* Avsluta / Avbryt */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button
          onClick={endMatch}
          style={{
            flex: 2,
            padding: "15px 0",
            border: "none",
            borderRadius: 14,
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 900,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          {cupMode ? "Avsluta match →" : "Avsluta match"}
        </button>
        <button
          onClick={() => setConfirmAbort(true)}
          style={{
            flex: 1,
            padding: "15px 0",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: 14,
            background: "transparent",
            color: "#f87171",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Avbryt
        </button>
      </div>

      {/* Bekräfta avbryt */}
      {confirmAbort && (
        <div
          onClick={() => setConfirmAbort(false)}
          className="hibs-overlay"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="hibs-dialog"
            style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 360 }}
          >
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Avbryta matchen?</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
              Resultat och målgörare sparas inte.
              {cupMode && " Trupp och kedjor behålls (cup-läge)."}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setConfirmAbort(false)}
                style={{ flex: 1, padding: "12px 0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "transparent", color: "#64748b", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}
              >
                Fortsätt
              </button>
              <button
                onClick={abortMatch}
                style={{ flex: 2, padding: "12px 0", border: "none", borderRadius: 12, background: "#f87171", color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}
              >
                Ja, avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
