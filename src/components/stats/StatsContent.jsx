import { useState } from "react";
import { FMT, gc, GC } from "../../lib/constants.js";

/**
 * StatsContent — Sprint 10. Säsongsstatistik, spelarleaderboard, matchhistorik.
 */
export default function StatsContent({
  history, stats, keeperStats, totalGoals, totalAssists, players, trainHistory,
}) {
  const [sortBy, setSortBy] = useState("points");

  const formResult = (m) => {
    const us = parseInt(m.result?.us);
    const them = parseInt(m.result?.them);
    if (isNaN(us) || isNaN(them) || m.result?.us === "" || m.result?.them === "") return null;
    if (us > them) return "V";
    if (us < them) return "F";
    return "O";
  };
  const formColor = (res) => res === "V" ? "#22c55e" : res === "F" ? "#f87171" : res === "O" ? "#fbbf24" : "#334155";

  const withRes = history.filter(m => formResult(m) !== null);
  const wins   = withRes.filter(m => formResult(m) === "V").length;
  const draws  = withRes.filter(m => formResult(m) === "O").length;
  const losses = withRes.filter(m => formResult(m) === "F").length;
  const winRate = withRes.length > 0 ? Math.round(wins / withRes.length * 100) : 0;
  const goalsFor     = withRes.reduce((s, m) => s + (parseInt(m.result?.us)   || 0), 0);
  const goalsAgainst = withRes.reduce((s, m) => s + (parseInt(m.result?.them) || 0), 0);

  // Filtrera bort målvakter från utespelarlistan
  const fieldStats = stats.filter(p => {
    const pl = players.find(x => x.name === p.name);
    return !pl || pl.role !== "malvakt";
  });

  const sortedStats = [...fieldStats].sort((a, b) => {
    if (sortBy === "goals")   return b.goals   - a.goals;
    if (sortBy === "assists") return b.assists - a.assists;
    if (sortBy === "matches") return (b.matches || 0) - (a.matches || 0);
    return b.points - a.points;
  });

  const SORT_TABS = [
    { id: "points",  label: "Poäng"  },
    { id: "goals",   label: "Mål"    },
    { id: "assists", label: "Assist" },
    { id: "matches", label: "Matcher"},
  ];

  return (
    <div>

      {/* SEASON OVERVIEW */}
      <div style={{
        background: "linear-gradient(135deg,rgba(34,197,94,0.11) 0%,rgba(22,163,74,0.04) 100%)",
        border: "1px solid rgba(34,197,94,0.16)",
        borderRadius: 20, padding: "18px", marginBottom: 12,
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#22c55e", letterSpacing: "0.1em", marginBottom: 12 }}>SÄSONGSÖVERSIKT</div>

        <div style={{ display: "flex", marginBottom: 14 }}>
          {[
            { val: wins,   label: "VINSTER",   color: "#22c55e" },
            { val: draws,  label: "OAVGJORDA", color: "#fbbf24" },
            { val: losses, label: "FÖRLUSTER", color: "#f87171" },
          ].map(({ val, label, color }, i) => (
            <div key={label} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ fontSize: 40, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color, opacity: 0.65, marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 7 }}>
          <div style={{ height: "100%", width: winRate + "%", background: "linear-gradient(90deg,#16a34a,#22c55e)", borderRadius: 99 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 11, color: "#4a5568" }}>{withRes.length} matcher med resultat</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#22c55e" }}>{winRate}% vinstprocent</div>
        </div>
      </div>

      {/* STATS GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { val: goalsFor,               label: "MÅL GJORDA",     color: "#22c55e" },
          { val: goalsAgainst,           label: "MÅL INSLÄPPTA",  color: "#f87171" },
          { val: history.length,         label: "MATCHER",        color: "#a78bfa" },
          { val: trainHistory?.length||0,label: "TRÄNINGAR",      color: "#34d399" },
        ].map(({ val, label, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 7, fontWeight: 700, color: "#4a5568", marginTop: 3, letterSpacing: "0.04em" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* PLAYER LEADERBOARD */}
      {stats.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#4a5568" }}>SPELARSTATISTIK</div>
            <div style={{ display: "flex", gap: 4 }}>
              {SORT_TABS.map(({ id, label }) => (
                <button key={id} onClick={() => setSortBy(id)} style={{
                  padding: "3px 10px",
                  border: "1px solid " + (sortBy === id ? "#22c55e" : "rgba(255,255,255,0.08)"),
                  borderRadius: 99,
                  background: sortBy === id ? "rgba(34,197,94,0.12)" : "transparent",
                  color: sortBy === id ? "#22c55e" : "#4a5568",
                  fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Column header */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 4 }}>
            <span style={{ width: 24, fontSize: 9, color: "#334155" }}>#</span>
            <span style={{ flex: 1, fontSize: 9, color: "#334155" }}>SPELARE</span>
            <span style={{ width: 28, textAlign: "center", fontSize: 9, color: "#a78bfa" }}>MAT</span>
            <span style={{ width: 28, textAlign: "center", fontSize: 9, color: "#fbbf24" }}>MÅL</span>
            <span style={{ width: 28, textAlign: "center", fontSize: 9, color: "#38bdf8" }}>ASS</span>
            <span style={{ width: 28, textAlign: "center", fontSize: 9, color: "#22c55e", fontWeight: 700 }}>PNT</span>
          </div>

          {sortedStats.map((p, i) => {
            const player = players.find(x => x.name === p.name);
            const pgc = player ? gc(player.group) : GC._;
            const medals = ["🥇", "🥈", "🥉"];
            const isTop = i < 3;
            return (
              <div key={p.name} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 0",
                borderBottom: i < sortedStats.length - 1 ? "1px solid rgba(255,255,255,0.035)" : "none",
              }}>
                <span style={{ width: 24, fontSize: isTop ? 15 : 11, textAlign: "center", color: "#4a5568", fontWeight: 700 }}>
                  {isTop ? medals[i] : i + 1}
                </span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: pgc.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: isTop ? 800 : 500, color: isTop ? "#fff" : "#94a3b8" }}>{p.name}</span>
                <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#a78bfa", fontWeight: sortBy === "matches" ? 900 : 400 }}>{p.matches || 0}</span>
                <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#fbbf24", fontWeight: sortBy === "goals"   ? 900 : 400 }}>{p.goals}</span>
                <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#38bdf8", fontWeight: sortBy === "assists" ? 900 : 400 }}>{p.assists}</span>
                <span style={{ width: 28, textAlign: "center", fontSize: 14, fontWeight: 900, color: sortBy === "points" ? "#22c55e" : "#4a5568" }}>{p.points}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* MATCH HISTORY */}
      {history.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#4a5568", marginBottom: 12 }}>MATCHHISTORIK</div>
          {history.map((m, i) => {
            const res = formResult(m);
            const col = formColor(res);
            const scorers = (m.scorers || []).filter(s => typeof s === "object" ? s.type === "goal" : true);
            return (
              <div key={m.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: col + "15", border: "1.5px solid " + col + "50", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: col, flexShrink: 0 }}>
                  {res || "–"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 1 }}>vs {m.opponent}</div>
                  <div style={{ fontSize: 11, color: "#4a5568", marginBottom: scorers.length > 0 ? 4 : 0 }}>{FMT(m.date)}</div>
                  {scorers.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      {scorers.slice(0, 4).map((s, si) => (
                        <span key={si} style={{ fontSize: 10, color: "#fbbf24", background: "rgba(251,191,36,0.07)", borderRadius: 99, padding: "1px 7px" }}>
                          {typeof s === "object" ? s.name : s}
                        </span>
                      ))}
                      {scorers.length > 4 && <span style={{ fontSize: 10, color: "#334155" }}>+{scorers.length - 4}</span>}
                    </div>
                  )}
                </div>
                {m.result && (
                  <div style={{ fontSize: 16, fontWeight: 900, color: col, flexShrink: 0, minWidth: 44, textAlign: "right" }}>
                    {m.result.us}-{m.result.them}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {history.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#334155" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 13 }}>Inga matcher spelade än</div>
        </div>
      )}

      {/* MÅLVAKTSSTATISTIK */}
      {keeperStats && keeperStats.length > 0 && (
        <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 16, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#a78bfa", marginBottom: 12 }}>🧤 MÅLVAKTSSTATISTIK</div>

          {/* Kolumnhuvud */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 8, borderBottom: "1px solid rgba(167,139,250,0.1)", marginBottom: 4 }}>
            <span style={{ flex: 1, fontSize: 9, color: "#334155" }}>KEEPER</span>
            <span style={{ width: 28, textAlign: "center", fontSize: 9, color: "#a78bfa" }}>MAT</span>
            <span style={{ width: 28, textAlign: "center", fontSize: 9, color: "#f87171" }}>INS</span>
            <span style={{ width: 28, textAlign: "center", fontSize: 9, color: "#22c55e" }}>RÄD</span>
            <span style={{ width: 32, textAlign: "center", fontSize: 9, color: "#38bdf8" }}>%</span>
            <span style={{ width: 28, textAlign: "center", fontSize: 9, color: "#fbbf24" }}>NOLL</span>
          </div>

          {keeperStats.map((k, i) => (
            <div key={k.name}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff" }}>{k.name}</span>
                <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#a78bfa", fontWeight: 700 }}>{k.matches}</span>
                <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#f87171" }}>{k.goalsAgainst}</span>
                <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#22c55e" }}>{k.saves}</span>
                <span style={{ width: 32, textAlign: "center", fontSize: 13, color: "#38bdf8", fontWeight: k.savePct !== null ? 700 : 400 }}>
                  {k.savePct !== null ? k.savePct + "%" : "–"}
                </span>
                <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#fbbf24", fontWeight: 700 }}>{k.cleanSheets}</span>
              </div>
              {/* V/O/F + GAA */}
              <div style={{ display: "flex", gap: 10, padding: "4px 0 8px", borderBottom: i < keeperStats.length - 1 ? "1px solid rgba(167,139,250,0.08)" : "none" }}>
                <span style={{ fontSize: 11, color: "#22c55e" }}>{k.wins}V</span>
                <span style={{ fontSize: 11, color: "#fbbf24" }}>{k.draws}O</span>
                <span style={{ fontSize: 11, color: "#f87171" }}>{k.losses}F</span>
                {k.gaa !== null && (
                  <span style={{ fontSize: 11, color: "#64748b", marginLeft: "auto" }}>GAA {k.gaa}</span>
                )}
                {k.shots === 0 && (
                  <span style={{ fontSize: 10, color: "#334155", marginLeft: "auto", fontStyle: "italic" }}>Skott ej trackade ännu</span>
                )}
              </div>
            </div>
          ))}

          <div style={{ fontSize: 10, color: "#334155", marginTop: 6 }}>
            INS = insläppta · RÄD = räddningar · NOLL = nollor (clean sheets) · GAA = mål/match
          </div>
        </div>
      )}

    </div>
  );
}
