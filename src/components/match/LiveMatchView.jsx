import { useState } from "react";
import { FMT, FONT } from "../../lib/constants.js";

/**
 * LiveMatchView — live-match-vy under pågående match.
 * Extraherad från MatchContent i Sprint 9.
 * Sprint 16: Spelarbyten (substitutions) — snabb swap av spelare under match.
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
  reserves,
  substitutions,
  makeSubstitution,
  checkedGoals,
  toggleGoal,
}) {
  // Substitution UI state
  const [subOpen, setSubOpen] = useState(false);
  const [subOut, setSubOut] = useState(null); // player id to take off

  const allMatchPlayers = players.filter(p =>
    (activeMatch.players || []).includes(p.id) ||
    (activeMatch.goalkeeper || []).includes(p.id)
  );

  // Players on pitch (utespelare, exkl. målvakt) — dynamisk baserat på activeMatch.players
  const onPitch = players.filter(p => (activeMatch.players || []).includes(p.id));
  // Alla spelare som INTE är på plan och INTE är målvakt — potentiella avbytare
  const offPitch = players.filter(p =>
    !(activeMatch.players || []).includes(p.id) &&
    !(activeMatch.goalkeeper || []).includes(p.id) &&
    p.role !== "malvakt" &&
    !(p.note && p.note.startsWith("⚠")) &&
    p.fitness !== "injured"
  );

  const handleSubConfirm = (inId) => {
    if (!subOut) return;
    makeSubstitution(subOut, inId);
    setSubOut(null);
    setSubOpen(false);
  };

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
        <div style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>
          {matchResult.us || 0}-{matchResult.them || 0}
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
            <div style={{ fontSize: 10, color, fontWeight: 700, marginBottom: 8 }}>{label}</div>
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

      {/* SKOTTSTATISTIK */}
      {(() => {
        const keeperNames = players
          .filter(p => (activeMatch.goalkeeper || []).includes(p.id))
          .map(p => p.name);

        const goalsFor    = parseInt(matchResult.us)   || 0;
        const goalsAgainst = parseInt(matchResult.them) || 0;

        const sf  = matchShotsFor || 0;
        const sa  = matchShots    || 0;

        const shotConv = sf > 0 ? Math.round(goalsFor    / sf  * 100) : null;
        const savePct  = sa > 0 ? Math.round(Math.max(0, sa - goalsAgainst) / sa * 100) : null;
        const saves    = Math.max(0, sa - goalsAgainst);

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
            <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", marginBottom: 12, letterSpacing: "0.08em" }}>
              SKOTTSTATISTIK
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {/* HIBS — skott framåt */}
              <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.14)", borderRadius: 12, padding: "12px 10px" }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#22c55e", marginBottom: 6 }}>🏒 HIBS SKOTT</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#22c55e", lineHeight: 1, marginBottom: 2 }}>{sf}</div>
                {shotConv !== null
                  ? <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10 }}>{goalsFor} mål · {shotConv}%</div>
                  : <div style={{ fontSize: 10, color: "#475569", marginBottom: 10 }}>{goalsFor} mål</div>
                }
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setMatchShotsFor(s => Math.max(0, s - 1))} style={UndoStyle}>−</button>
                  <button onClick={() => setMatchShotsFor(s => s + 1)} style={BtnStyle("#22c55e")}>+ Skott</button>
                </div>
              </div>

              {/* KEEPER — skott mot */}
              <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.14)", borderRadius: 12, padding: "12px 10px" }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#a78bfa", marginBottom: 2 }}>🧤 RÄDDNINGAR</div>
                {keeperNames.length > 0 && (
                  <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>{keeperNames.join(" / ")}</div>
                )}
                <div style={{ fontSize: 32, fontWeight: 900, color: "#a78bfa", lineHeight: 1, marginBottom: 2 }}>{saves}</div>
                {savePct !== null
                  ? <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10 }}>{sa} skott · {savePct}%</div>
                  : <div style={{ fontSize: 10, color: "#475569", marginBottom: 10 }}>{goalsAgainst} insläppta</div>
                }
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setMatchShots(s => Math.max(0, s - 1))} style={UndoStyle}>−</button>
                  <button onClick={() => setMatchShots(s => s + 1)} style={BtnStyle("#a78bfa")}>+ Skott</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── SPELARBYTEN (Sprint 16) ──────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <button
          onClick={() => { setSubOpen(o => !o); setSubOut(null); }}
          style={{
            width: "100%",
            padding: "13px 0",
            border: "1px solid rgba(251,191,36,0.25)",
            borderRadius: 14,
            background: subOpen ? "rgba(251,191,36,0.10)" : "rgba(251,191,36,0.04)",
            color: "#fbbf24",
            fontSize: 14,
            fontWeight: 800,
            fontFamily: "inherit",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          🔄 Byte {substitutions?.length > 0 ? `(${substitutions.length})` : ""}
        </button>

        {/* Byte-panel */}
        {subOpen && (
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(251,191,36,0.15)",
            borderRadius: 14,
            padding: 14,
            marginTop: 8,
          }}>
            {/* Steg 1: Välj spelare UT */}
            <div style={{ fontSize: 10, fontWeight: 800, color: "#f87171", marginBottom: 8, letterSpacing: "0.06em" }}>
              {subOut ? "✓ UT: " + (players.find(p => p.id === subOut)?.name || "?") : "1. VÄLJ SPELARE UT"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {onPitch.map(p => {
                const isOut = subOut === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSubOut(isOut ? null : p.id)}
                    style={{
                      padding: "7px 14px",
                      border: "1.5px solid " + (isOut ? "#f87171" : "rgba(255,255,255,0.10)"),
                      borderRadius: 99,
                      background: isOut ? "rgba(248,113,113,0.12)" : "transparent",
                      color: isOut ? "#f87171" : "#94a3b8",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      minHeight: 44,
                    }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            {/* Steg 2: Välj spelare IN (visas bara om UT vald) */}
            {subOut && (
              <>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#22c55e", marginBottom: 8, letterSpacing: "0.06em" }}>
                  2. VÄLJ SPELARE IN
                </div>
                {offPitch.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#64748b", padding: "8px 0" }}>
                    Inga tillgängliga avbytare
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {offPitch.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleSubConfirm(p.id)}
                        style={{
                          padding: "7px 14px",
                          border: "1.5px solid rgba(34,197,94,0.25)",
                          borderRadius: 99,
                          background: "rgba(34,197,94,0.06)",
                          color: "#22c55e",
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "inherit",
                          cursor: "pointer",
                          minHeight: 44,
                        }}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Byte-logg */}
        {substitutions?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 4 }}>
              BYTEN
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {substitutions.map((s, i) => (
                <span key={i} style={{
                  padding: "4px 10px",
                  borderRadius: 99,
                  background: "rgba(251,191,36,0.06)",
                  border: "1px solid rgba(251,191,36,0.15)",
                  color: "#fbbf24",
                  fontSize: FONT.label,
                  fontWeight: 600,
                }}>
                  <span style={{ color: "#f87171" }}>↓{s.outName}</span>
                  {" "}
                  <span style={{ color: "#22c55e" }}>↑{s.inName}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lagmål — interaktiva chips, tryck för att bocka av (Sprint 19) */}
      {activeMatch.teamGoals?.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: "10px 14px",
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>
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
              fontSize: 10,
              color: "#64748b",
              marginTop: 8,
              fontWeight: 600,
            }}>
              {checkedGoals?.size || 0}/{activeMatch.teamGoals.length} avklarade
            </div>
          )}
        </div>
      )}

      {/* Målgörare + Assist */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700, marginBottom: 8 }}>MÅL</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {allMatchPlayers.map(p => {
              const cnt = matchScorers.filter(s => s.name === p.name && s.type === "goal").length;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setMatchScorers(s => [...s, { name: p.name, type: "goal" }]);
                    setMatchResult(r => ({ ...r, us: (parseInt(r.us) || 0) + 1 }));
                  }}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid " + (cnt > 0 ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.07)"),
                    borderRadius: 99,
                    background: cnt > 0 ? "rgba(251,191,36,0.1)" : "transparent",
                    color: cnt > 0 ? "#fbbf24" : "#64748b",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {p.name}{cnt > 0 ? ` (${cnt})` : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "#38bdf8", fontWeight: 700, marginBottom: 8 }}>ASSIST</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {allMatchPlayers.map(p => {
              const cnt = matchScorers.filter(s => s.name === p.name && s.type === "assist").length;
              return (
                <button
                  key={p.id}
                  onClick={() => setMatchScorers(s => [...s, { name: p.name, type: "assist" }])}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid " + (cnt > 0 ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.07)"),
                    borderRadius: 99,
                    background: cnt > 0 ? "rgba(56,189,248,0.1)" : "transparent",
                    color: cnt > 0 ? "#38bdf8" : "#64748b",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {p.name}{cnt > 0 ? ` (${cnt})` : ""}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Händelselogg — tryck ✕ för att ta bort valfri händelse */}
      {matchScorers.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>
            HÄNDELSELOGG — tryck ✕ för att ångra
          </div>
          {[...matchScorers].reverse().map((s, ri) => {
            const origIdx = matchScorers.length - 1 - ri;
            const isGoal = s.type === "goal";
            return (
              <div
                key={origIdx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: isGoal ? "rgba(251,191,36,0.05)" : "rgba(56,189,248,0.04)",
                  border: "1px solid " + (isGoal ? "rgba(251,191,36,0.15)" : "rgba(56,189,248,0.12)"),
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 13, color: isGoal ? "#fbbf24" : "#38bdf8", fontWeight: 600 }}>
                  {isGoal ? "⚽" : "🎯"} {s.name}
                </span>
                <button
                  onClick={() => {
                    if (isGoal) setMatchResult(r => ({ ...r, us: Math.max(0, (parseInt(r.us) || 0) - 1) }));
                    setMatchScorers(prev => prev.filter((_, idx) => idx !== origIdx));
                  }}
                  style={{
                    background: "rgba(248,113,113,0.08)",
                    border: "1px solid rgba(248,113,113,0.2)",
                    borderRadius: 6,
                    color: "#f87171",
                    cursor: "pointer",
                    padding: "3px 8px",
                    fontSize: 13,
                    lineHeight: 1,
                    fontFamily: "inherit",
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

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
