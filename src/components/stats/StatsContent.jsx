import { useState, useMemo } from "react";
import { FMT, gc, GC, FONT, formResult, formColor, SEASONS } from "../../lib/constants.js";
import KeeperStatsCard from "./KeeperStatsCard.jsx";

/**
 * StatsContent — Sprint 23: added P12 TRÄNINGSNÄRVARO section.
 * New props: attendance (object { [sessionId]: [playerName, ...] })
 */
/**
 * TrendSparkline — P2 (Sprint 67): mini-stapeldiagram med poäng per match,
 * senaste 10 matcherna i kronologisk ordning. Amber = gjorde mål, blå = enbart
 * assist, dova staplar = spelade utan poäng. Glance-läsbar vid rinken.
 */
function TrendSparkline({ trend }) {
  const last = trend.slice(-10);
  const max = Math.max(1, ...last.map(t => t.points));
  const sumG = last.reduce((s, t) => s + t.goals, 0);
  const sumA = last.reduce((s, t) => s + t.assists, 0);
  return (
    <div style={{ padding: "10px 0 12px 30px" }}>
      <div
        role="img"
        aria-label={"Trend senaste " + last.length + " matcherna: " + sumG + " mål, " + sumA + " assist"}
        style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 44 }}
      >
        {last.map((t, i) => {
          const h = t.points > 0 ? 8 + Math.round(t.points / max * 36) : 4;
          const bg = t.goals > 0 ? "#fbbf24" : t.assists > 0 ? "#38bdf8" : "rgba(255,255,255,0.10)";
          return (
            <div key={i}
              title={FMT(t.date) + " vs " + t.opponent + ": " + t.goals + " mål, " + t.assists + " assist"}
              style={{ flex: 1, maxWidth: 26, height: h, background: bg, borderRadius: 3, transition: "height 0.2s" }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: FONT.label, color: "#475569" }}>
          Senaste {last.length} matcherna &nbsp;·&nbsp; äldst → nyast
        </span>
        <span style={{ fontSize: FONT.label, fontWeight: 700 }}>
          <span style={{ color: "#fbbf24" }}>{sumG} mål</span>
          <span style={{ color: "#475569" }}> · </span>
          <span style={{ color: "#38bdf8" }}>{sumA} assist</span>
        </span>
      </div>
    </div>
  );
}

export default function StatsContent({
  history, stats, keeperStats, shotStats, totalGoals, totalAssists, players, trainHistory,
  attendance = {}, playerTrends = {},
  season, setSeason,
}) {
  const [sortBy, setSortBy] = useState("points");
  const [expanded, setExpanded] = useState(null); // P2 (Sprint 67): spelarnamn med öppen trendgraf

  const withRes = history.filter(m => formResult(m) !== null);
  const wins   = withRes.filter(m => formResult(m) === "V").length;
  const draws  = withRes.filter(m => formResult(m) === "O").length;
  const losses = withRes.filter(m => formResult(m) === "F").length;
  const winRate = withRes.length > 0 ? Math.round(wins / withRes.length * 100) : 0;
  const goalsFor     = withRes.reduce((s, m) => s + (parseInt(m.result?.us)   || 0), 0);
  const goalsAgainst = withRes.reduce((s, m) => s + (parseInt(m.result?.them) || 0), 0);
  const goalDiff     = goalsFor - goalsAgainst; // Sprint 61: målskillnad (glance-chip i översikten)
  const diffColor    = goalDiff > 0 ? "#22c55e" : goalDiff < 0 ? "#f87171" : "#94a3b8";

  // Sprint 62: aktuell form-svit — sammanhängande rad med samma resultat, nyaste först (glance-momentum)
  // history är date.desc (nyaste först), så index 0 = senaste matchen.
  const formStreak = useMemo(() => {
    const seq = history.map(formResult).filter(r => r !== null);
    if (seq.length === 0) return null;
    const type = seq[0];
    let count = 0;
    for (const r of seq) { if (r === type) count++; else break; }
    return count >= 2 ? { type, count } : null;
  }, [history]);

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

  // ── P12 Närvaro stats ──────────────────────────────────────────────────────
  const trackedSessions = useMemo(
    () => trainHistory.filter(s => attendance[s.id] && attendance[s.id].length > 0),
    [trainHistory, attendance]
  );

  const attendanceStats = useMemo(() => {
    if (trackedSessions.length === 0) return [];
    return players
      .map(p => {
        const count = trackedSessions.filter(s => (attendance[s.id] || []).includes(p.name)).length;
        const pct = Math.round(count / trackedSessions.length * 100);
        return { name: p.name, group: p.group, count, pct };
      })
      .filter(p => p.count > 0)
      .sort((a, b) => b.pct - a.pct || b.count - a.count);
  }, [players, trackedSessions, attendance]);

  return (
    <div>

      {/* Sprint 78: säsongsväljare — styr Hem + Statistik (Mer→Matchhistorik visar alltid allt) */}
      {setSeason && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {SEASONS.map(s => (
            <button
              key={s}
              onClick={() => setSeason(s)}
              style={{ flex: 1, padding: "10px 0", minHeight: 44, border: "1px solid " + (season === s ? "#22c55e" : "rgba(255,255,255,0.07)"), borderRadius: 10, background: season === s ? "rgba(34,197,94,0.1)" : "transparent", color: season === s ? "#22c55e" : "#64748b", fontSize: 12, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}
            >
              {s === "Alla" ? "Alla säsonger" : "Säsong " + s}
            </button>
          ))}
        </div>
      )}

      {/* SEASON OVERVIEW */}
      <div style={{
        background: "linear-gradient(135deg,rgba(34,197,94,0.11) 0%,rgba(22,163,74,0.04) 100%)",
        border: "1px solid rgba(34,197,94,0.16)",
        borderRadius: 20, padding: "18px", marginBottom: 12,
      }}>
        <div style={{ fontSize: FONT.label, fontWeight: 800, color: "#22c55e", letterSpacing: "0.1em", marginBottom: 12 }}>SÄSONGSÖVERSIKT</div>

        <div style={{ display: "flex", marginBottom: 14 }}>
          {[
            { val: wins,   label: "VINSTER",   color: "#22c55e" },
            { val: draws,  label: "OAVGJORDA", color: "#fbbf24" },
            { val: losses, label: "FÖRLUSTER", color: "#f87171" },
          ].map(({ val, label, color }, i) => (
            <div key={label} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ fontSize: 40, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: FONT.label, fontWeight: 700, color, opacity: 0.65, marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 7 }}>
          <div style={{ height: "100%", width: winRate + "%", background: "linear-gradient(90deg,#16a34a,#22c55e)", borderRadius: 99 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "#475569" }}>{withRes.length} matcher med resultat</div>
          {withRes.length > 0 && (
            <div style={{ fontSize: 12, fontWeight: 800, color: diffColor }} title="Målskillnad (gjorda − insläppta)">
              {goalDiff > 0 ? "+" : ""}{goalDiff} <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.7 }}>MÅLSKILLNAD</span>
            </div>
          )}
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
            <div style={{ fontSize: 7, fontWeight: 700, color: "#475569", marginTop: 3, letterSpacing: "0.04em" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* SKOTTSTATISTIK — visas bara om skott trackats */}
      {shotStats && (shotStats.shotsFor > 0 || shotStats.shotsAgainst > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>

          {/* HIBS skott */}
          <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 14, padding: "14px 12px" }}>
            <div style={{ fontSize: FONT.label, fontWeight: 800, color: "#22c55e", marginBottom: 8 }}>🏒 HIBS SKOTT</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#22c55e", lineHeight: 1 }}>{shotStats.shotsFor}</div>
            <div style={{ fontSize: FONT.label, color: "#475569", marginTop: 3 }}>skott på mål</div>
            {shotStats.shotConversion !== null && (
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#22c55e" }}>
                {shotStats.shotConversion}% <span style={{ fontSize: FONT.label, fontWeight: 400, color: "#475569" }}>konvertering</span>
              </div>
            )}
          </div>

          {/* Keeperns räddningsprocent */}
          <div style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 14, padding: "14px 12px" }}>
            <div style={{ fontSize: FONT.label, fontWeight: 800, color: "#a78bfa", marginBottom: 8 }}>🧤 KEEPER</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#a78bfa", lineHeight: 1 }}>{shotStats.shotsAgainst}</div>
            <div style={{ fontSize: FONT.label, color: "#475569", marginTop: 3 }}>skott mot</div>
            {shotStats.savePct !== null && (
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#a78bfa" }}>
                {shotStats.savePct}% <span style={{ fontSize: FONT.label, fontWeight: 400, color: "#475569" }}>räddade</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* PLAYER LEADERBOARD */}
      {stats.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: FONT.label, fontWeight: 700, color: "#475569" }}>SPELARSTATISTIK</div>
            <div style={{ display: "flex", gap: 4 }}>
              {SORT_TABS.map(({ id, label }) => (
                <button key={id} onClick={() => setSortBy(id)} style={{
                  padding: "3px 10px",
                  border: "1px solid " + (sortBy === id ? "#22c55e" : "rgba(255,255,255,0.08)"),
                  borderRadius: 99,
                  background: sortBy === id ? "rgba(34,197,94,0.12)" : "transparent",
                  color: sortBy === id ? "#22c55e" : "#475569",
                  fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Column header */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 4 }}>
            <span style={{ width: 24, fontSize: FONT.label, color: "#475569" }}>#</span>
            <span style={{ flex: 1, fontSize: FONT.label, color: "#475569" }}>SPELARE</span>
            <span style={{ width: 28, textAlign: "center", fontSize: FONT.label, color: "#a78bfa" }}>MAT</span>
            <span style={{ width: 28, textAlign: "center", fontSize: FONT.label, color: "#fbbf24" }}>MÅL</span>
            <span style={{ width: 28, textAlign: "center", fontSize: FONT.label, color: "#38bdf8" }}>ASS</span>
            <span style={{ width: 28, textAlign: "center", fontSize: FONT.label, color: "#22c55e", fontWeight: 700 }}>PNT</span>
          </div>

          {sortedStats.map((p, i) => {
            const player = players.find(x => x.name === p.name);
            const pgc = player ? gc(player.group) : GC._;
            const medals = ["🥇", "🥈", "🥉"];
            const isTop = i < 3;
            const trend = playerTrends[p.name] || [];
            const isOpen = expanded === p.name;
            return (
              <div key={p.name} style={{ borderBottom: i < sortedStats.length - 1 ? "1px solid rgba(255,255,255,0.035)" : "none" }}>
                {/* P2 (Sprint 67): raden är tappbar — öppnar trend-sparkline. ≥44px touch-target. */}
                <div
                  role="button" tabIndex={0}
                  aria-expanded={isOpen}
                  aria-label={"Visa trend för " + p.name}
                  onClick={() => setExpanded(isOpen ? null : p.name)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(isOpen ? null : p.name); } }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    minHeight: 44, padding: "4px 0",
                    cursor: trend.length > 0 ? "pointer" : "default",
                  }}>
                  <span style={{ width: 24, fontSize: isTop ? 15 : 11, textAlign: "center", color: "#475569", fontWeight: 700 }}>
                    {isTop ? medals[i] : i + 1}
                  </span>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: pgc.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: isTop ? 800 : 500, color: isTop ? "#fff" : "#94a3b8" }}>
                    {p.name}
                    {trend.length > 0 && (
                      <span style={{ fontSize: 9, color: isOpen ? "#22c55e" : "#334155", marginLeft: 6 }}>{isOpen ? "▾" : "▸"}</span>
                    )}
                  </span>
                  <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#a78bfa", fontWeight: sortBy === "matches" ? 900 : 400 }}>{p.matches || 0}</span>
                  <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#fbbf24", fontWeight: sortBy === "goals"   ? 900 : 400 }}>{p.goals}</span>
                  <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#38bdf8", fontWeight: sortBy === "assists" ? 900 : 400 }}>{p.assists}</span>
                  <span style={{ width: 28, textAlign: "center", fontSize: 14, fontWeight: 900, color: sortBy === "points" ? "#22c55e" : "#475569" }}>{p.points}</span>
                </div>
                {isOpen && trend.length > 0 && <TrendSparkline trend={trend} />}
              </div>
            );
          })}
        </div>
      )}

      {/* MATCH HISTORY */}
      {history.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: FONT.label, fontWeight: 700, color: "#475569" }}>MATCHHISTORIK</div>
            {formStreak && (
              <span
                title="Aktuell form-svit (senaste matcherna)"
                style={{
                  fontSize: FONT.label, fontWeight: 800,
                  color: formColor(formStreak.type),
                  background: formColor(formStreak.type) + "14",
                  border: "1px solid " + formColor(formStreak.type) + "33",
                  borderRadius: 99, padding: "3px 10px",
                }}
              >
                {formStreak.type === "V" ? "🔥 " : ""}{formStreak.count} raka {formStreak.type === "V" ? "vinster" : formStreak.type === "F" ? "förluster" : "oavgjorda"}
              </span>
            )}
          </div>
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
                  <div style={{ fontSize: 11, color: "#475569", marginBottom: scorers.length > 0 ? 4 : 0 }}>{FMT(m.date)}</div>
                  {scorers.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      {scorers.slice(0, 4).map((s, si) => (
                        <span key={si} style={{ fontSize: FONT.label, color: "#fbbf24", background: "rgba(251,191,36,0.07)", borderRadius: 99, padding: "1px 7px" }}>
                          {typeof s === "object" ? s.name : s}
                        </span>
                      ))}
                      {scorers.length > 4 && <span style={{ fontSize: FONT.label, color: "#475569" }}>+{scorers.length - 4}</span>}
                    </div>
                  )}
                  {(m.teamGoals || []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: scorers.length > 0 ? 3 : 4 }}>
                      {m.teamGoals.map((g, gi) => {
                        const done = (m.checked_goals || []).includes(gi);
                        return (
                          <span key={gi} style={{ fontSize: FONT.label, color: done ? "#22c55e" : "#475569", background: done ? "rgba(34,197,94,0.07)" : "rgba(255,255,255,0.03)", borderRadius: 99, padding: "1px 7px" }}>
                            {done ? "✓ " : "○ "}{g}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {(m.substitutions || []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 3 }}>
                      {(m.substitutions || []).map((sub, si) => (
                        <span key={si} style={{ fontSize: FONT.label, color: "#94a3b8", background: "rgba(148,163,184,0.07)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 99, padding: "1px 7px" }}>
                          🔄 {sub.outName} → {sub.inName}
                        </span>
                      ))}
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
        <div style={{ textAlign: "center", padding: "48px 0", color: "#475569" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 13 }}>Inga matcher spelade än</div>
        </div>
      )}

      {/* MÅLVAKTSSTATISTIK (Sprint 61: inline-block ersatt med KeeperStatsCard — slutför S60-extraktionen) */}
      <KeeperStatsCard keeperStats={keeperStats} />

      {/* ── P12 TRÄNINGSNÄRVARO ─────────────────────────────────────────────── */}
      {attendanceStats.length > 0 && (
        <div style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 16, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: FONT.label, fontWeight: 800, color: "#34d399" }}>👥 TRÄNINGSNÄRVARO</div>
            <div style={{ fontSize: FONT.label, color: "#475569" }}>{trackedSessions.length} träningar trackade</div>
          </div>

          {/* Column header */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 8, borderBottom: "1px solid rgba(52,211,153,0.1)", marginBottom: 4 }}>
            <span style={{ flex: 1, fontSize: FONT.label, color: "#475569" }}>SPELARE</span>
            <span style={{ width: 36, textAlign: "center", fontSize: FONT.label, color: "#34d399" }}>TRÄN</span>
            <span style={{ width: 40, textAlign: "right", fontSize: FONT.label, color: "#34d399", fontWeight: 700 }}>NÄRVARO</span>
          </div>

          {attendanceStats.map((p, i) => {
            const pgc = gc(p.group);
            const barW = p.pct;
            const barColor = p.pct >= 80 ? "#22c55e" : p.pct >= 60 ? "#fbbf24" : "#f87171";
            return (
              <div key={p.name} style={{
                padding: "8px 0",
                borderBottom: i < attendanceStats.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: pgc.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>{p.name}</span>
                  <span style={{ width: 36, textAlign: "center", fontSize: 12, color: "#64748b" }}>{p.count}</span>
                  <span style={{ width: 40, textAlign: "right", fontSize: 13, fontWeight: 800, color: barColor }}>{p.pct}%</span>
                </div>
                {/* Progress bar */}
                <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", marginLeft: 13 }}>
                  <div style={{ height: "100%", width: barW + "%", background: barColor, borderRadius: 99, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })}

          <div style={{ fontSize: FONT.label, color: "#475569", marginTop: 8 }}>
            Markera närvaro i Träning → Logg → Markera närvaro
          </div>
        </div>
      )}

    </div>
  );
}
