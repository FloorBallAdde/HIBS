import { FMT } from "../../lib/constants.js";

/**
 * LiveMatchView — live-match-vy under pågående match.
 * Extraherad från MatchContent i Sprint 9.
 * Hanterar: resultat, målgörare, assist, lagmål-visning, avsluta/avbryt.
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
}) {
  const allMatchPlayers = players.filter(p =>
    (activeMatch.players || []).includes(p.id) ||
    (activeMatch.goalkeeper || []).includes(p.id)
  );

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
          fontSize: 11,
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
          <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>
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

      {/* SKOTTSTATISTIK — HIBS framåt + Keeper bakåt */}
      {(() => {
        const keeperNames = players
          .filter(p => (activeMatch.goalkeeper || []).includes(p.id))
          .map(p => p.name);

        const goalsFor    = parseInt(matchResult.us)   || 0;
        const goalsAgainst = parseInt(matchResult.them) || 0;

        const sf  = matchShotsFor || 0;   // HIBS skott framåt
        const sa  = matchShots    || 0;   // skott mot vår keeper

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
          borderRadius: 10, background: "rgba(255,255,255,0.03)", color: "#4a5568",
          fontSize: 18, fontFamily: "inherit", cursor: "pointer", flexShrink: 0,
        };

        return (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px", marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#4a5568", marginBottom: 12, letterSpacing: "0.08em" }}>
              SKOTTSTATISTIK
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

              {/* HIBS — skott framåt */}
              <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.14)", borderRadius: 12, padding: "12px 10px" }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#22c55e", marginBottom: 6 }}>🏒 HIBS SKOTT</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#22c55e", lineHeight: 1, marginBottom: 2 }}>{sf}</div>
                {shotConv !== null
                  ? <div style={{ fontSize: 10, color: "#4a5568", marginBottom: 10 }}>{goalsFor} mål · {shotConv}%</div>
                  : <div style={{ fontSize: 10, color: "#334155", marginBottom: 10 }}>{goalsFor} mål</div>
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
                  <div style={{ fontSize: 9, color: "#4a5568", marginBottom: 4 }}>{keeperNames.join(" / ")}</div>
                )}
                <div style={{ fontSize: 32, fontWeight: 900, color: "#a78bfa", lineHeight: 1, marginBottom: 2 }}>{saves}</div>
                {savePct !== null
                  ? <div style={{ fontSize: 10, color: "#4a5568", marginBottom: 10 }}>{sa} skott · {savePct}%</div>
                  : <div style={{ fontSize: 10, color: "#334155", marginBottom: 10 }}>{goalsAgainst} insläppta</div>
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

      {/* Lagmål — visas som interaktiva chips */}
      {activeMatch.teamGoals?.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: "10px 14px",
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 9, color: "#4a5568", fontWeight: 700, marginBottom: 6 }}>
            LAGMÅL — kom ihåg:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {activeMatch.teamGoals.map((g, i) => (
              <span key={i} style={{
                padding: "5px 12px",
                borderRadius: 99,
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                color: "#22c55e",
                fontSize: 12,
                fontWeight: 600,
              }}>
                {g}
              </span>
            ))}
          </div>
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
                    color: cnt > 0 ? "#fbbf24" : "#4a5568",
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
                    color: cnt > 0 ? "#38bdf8" : "#4a5568",
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

      {/* Ångra senaste */}
      {matchScorers.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => {
              const last = matchScorers[matchScorers.length - 1];
              if (last?.type === "goal") setMatchResult(r => ({ ...r, us: Math.max(0, (parseInt(r.us) || 0) - 1) }));
              setMatchScorers(s => s.slice(0, -1));
            }}
            style={{
              padding: "8px 16px",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 99,
              background: "transparent",
              color: "#4a5568",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Ångra senaste
          </button>
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
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
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
                style={{ flex: 1, padding: "12px 0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "transparent", color: "#4a5568", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}
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
