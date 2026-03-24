import StableInput from "../ui/StableInput.jsx";
import UpcomingMatchCard from "./UpcomingMatchCard.jsx";
import { FMT, GC, gc, FONT } from "../../lib/constants.js";
import { sbPost, sbDel } from "../../lib/supabase.js";
import { useState } from "react";

/**
 * HomeContent — Sprint 10 redesign.
 * Hero season record, quick stats strip, form track, next match, top scorers.
 */
export default function HomeContent({
  injured, upcomingMatches, addUpcoming, removeUpcoming, updateUpcomingRsvp, latestMatch,
  stats, totalGoals, totalAssists, history, players,
  trainHistory,
  trainNoteInput, setTrainNoteInput, trainNotes, setTrainNotes,
  clubId, uid, tok,
}) {
  const addNote = () => {
    if (!trainNoteInput.trim()) return;
    const txt = trainNoteInput.trim();
    sbPost("training_notes", { club_id: clubId, text: txt, created_by: uid }, tok).then(r => {
      const s = Array.isArray(r) && r[0] ? r[0] : { id: Date.now(), text: txt };
      setTrainNotes(n => [s, ...n]);
    });
    setTrainNoteInput("");
  };

  const formResult = (m) => {
    const us = parseInt(m.result?.us);
    const them = parseInt(m.result?.them);
    if (isNaN(us) || isNaN(them) || m.result?.us === "" || m.result?.them === "") return null;
    if (us > them) return "V";
    if (us < them) return "F";
    return "O";
  };
  const formColor = (res) => res === "V" ? "#22c55e" : res === "F" ? "#f87171" : res === "O" ? "#fbbf24" : "#475569";

  // Season record
  const withRes = history.filter(m => formResult(m) !== null);
  const wins   = withRes.filter(m => formResult(m) === "V").length;
  const draws  = withRes.filter(m => formResult(m) === "O").length;
  const losses = withRes.filter(m => formResult(m) === "F").length;
  const winRate = withRes.length > 0 ? Math.round(wins / withRes.length * 100) : 0;

  // Current streak
  const recentForms = history.slice(0, 10).map(m => formResult(m)).filter(Boolean);
  let streak = 0;
  const streakType = recentForms[0];
  if (streakType) {
    for (const r of recentForms) { if (r === streakType) streak++; else break; }
  }

  const lastTrain = trainHistory && trainHistory.length > 0 ? trainHistory[0] : null;

  return (
    <div className="hibs-tab-content">
      {/* INJURED ALERT */}
      {injured.length > 0 && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: 14, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#f87171", marginBottom: 2 }}>SKADADE</div>
            <div style={{ fontSize: 12, color: "#fca5a5" }}>{injured.map(p => p.name).join(", ")}</div>
          </div>
        </div>
      )}

      {/* HERO — SEASON RECORD */}
      {withRes.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg,rgba(34,197,94,0.12) 0%,rgba(22,163,74,0.05) 100%)",
          border: "1px solid rgba(34,197,94,0.18)",
          borderRadius: 20, padding: "18px 18px 16px", marginBottom: 12, position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -24, right: -24, width: 110, height: 110, borderRadius: "50%", background: "rgba(34,197,94,0.05)", pointerEvents: "none" }} />
          <div style={{ fontSize: 10, fontWeight: 800, color: "#22c55e", letterSpacing: "0.1em", marginBottom: 12 }}>
            SÄSONGEN {new Date().getFullYear()}
          </div>

          {/* Big W · D · L */}
          <div style={{ display: "flex", marginBottom: 14 }}>
            {[
              { val: wins,   label: "VINSTER",    color: "#22c55e" },
              { val: draws,  label: "OAVGJORDA",  color: "#fbbf24" },
              { val: losses, label: "FÖRLUSTER",  color: "#f87171" },
            ].map(({ val, label, color }, i) => (
              <div key={label} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ fontSize: 44, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: FONT.label, fontWeight: 700, color, opacity: 0.65, marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Win-rate bar */}
          <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 7 }}>
            <div style={{ height: "100%", width: winRate + "%", background: "linear-gradient(90deg,#16a34a,#22c55e,#4ade80)", borderRadius: 99, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>{withRes.length} matcher spelade</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#22c55e" }}>{winRate}% vinstprocent</div>
          </div>

          {/* Streak badge */}
          {streak >= 2 && (
            <div style={{ marginTop: 10, padding: "5px 12px", background: streakType === "V" ? "rgba(34,197,94,0.12)" : streakType === "F" ? "rgba(248,113,113,0.12)" : "rgba(251,191,36,0.12)", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 14 }}>{streakType === "V" ? "🔥" : streakType === "F" ? "❄️" : "〰️"}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: formColor(streakType) }}>
                {streak} {streakType === "V" ? "vinster" : streakType === "F" ? "förluster" : "oavgjorda"} i rad
              </span>
            </div>
          )}
        </div>
      )}

      {/* QUICK STATS STRIP */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { val: totalGoals,              label: "MÅL",       color: "#fbbf24" },
          { val: totalAssists,            label: "ASSIST",    color: "#38bdf8" },
          { val: history.length,          label: "MATCHER",   color: "#a78bfa" },
          { val: trainHistory?.length||0, label: "TRÄNINGAR", color: "#34d399" },
        ].map(({ val, label, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginTop: 4, letterSpacing: "0.06em" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* FORM — last 5 matches */}
      {history.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>SENASTE FORM</div>
          <div style={{ display: "flex", gap: 6 }}>
            {history.slice(0, 5).map((m, i) => {
              const res = formResult(m);
              const col = formColor(res);
              return (
                <div key={m.id || i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: "100%", height: 36, borderRadius: 10, background: res ? col + "18" : "rgba(255,255,255,0.02)", border: "1.5px " + (res ? "solid" : "dashed") + " " + col, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: col }}>
                    {res || "–"}
                  </div>
                  <div style={{ fontSize: 8, color: "#475569", textAlign: "center" }}>
                    {m.result?.us !== "" && m.result?.them !== "" ? `${m.result.us}-${m.result.them}` : m.opponent?.slice(0, 5) || ""}
                  </div>
                </div>
              );
            })}
            {history.length < 5 && Array.from({ length: 5 - history.length }).map((_, i) => (
              <div key={"e" + i} style={{ flex: 1, height: 36, borderRadius: 10, border: "1.5px dashed rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }} />
            ))}
          </div>
        </div>
      )}

      {/* NÄSTA MATCH — extraherad till UpcomingMatchCard (Sprint 15) */}
      <UpcomingMatchCard
        upcomingMatches={upcomingMatches}
        addUpcoming={addUpcoming}
        removeUpcoming={removeUpcoming}
        updateUpcomingRsvp={updateUpcomingRsvp}
        players={players}
      />

      {/* SENASTE MATCH */}
      {latestMatch && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>SENASTE MATCH</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 2 }}>vs {latestMatch.opponent}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{FMT(latestMatch.date)}</div>
            </div>
            {latestMatch.result && (() => {
              const res = formResult(latestMatch);
              const col = formColor(res);
              return (
                <div style={{ fontSize: 22, fontWeight: 900, color: col, background: col + "15", border: "1px solid " + col + "35", borderRadius: 12, padding: "6px 14px" }}>
                  {latestMatch.result.us}-{latestMatch.result.them}
                </div>
              );
            })()}
          </div>
          {(latestMatch.scorers || []).filter(s => typeof s === "object" ? s.type === "goal" : true).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {(latestMatch.scorers || []).filter(s => typeof s === "object" ? s.type === "goal" : true).map((s, i) => (
                <span key={i} style={{ fontSize: 11, color: "#fbbf24", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 99, padding: "2px 10px" }}>
                  ⚽ {typeof s === "object" ? s.name : s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TOP 3 SCORERS */}
      {stats.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>SKYTTELIGA</div>
          {stats.slice(0, 3).map((p, i) => {
            const player = players.find(x => x.name === p.name);
            const pgc = player ? gc(player.group) : GC._;
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 2 ? 8 : 0 }}>
                <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{medals[i]}</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: pgc.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>{p.goals}M</span>
                <span style={{ fontSize: 12, color: "#38bdf8" }}>{p.assists}A</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#22c55e", width: 22, textAlign: "right" }}>{p.points}P</span>
              </div>
            );
          })}
        </div>
      )}

      {/* SENASTE TRÄNING */}
      {lastTrain && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>SENASTE TRÄNING</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{FMT(lastTrain.date)}</div>
              {lastTrain.exercises?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                  {lastTrain.exercises.slice(0, 3).map((ex, i) => {
                    const name = typeof ex === "object" ? ex.name : ex;
                    return <span key={i} style={{ fontSize: 10, color: "#38bdf8", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 99, padding: "2px 8px" }}>{name}</span>;
                  })}
                  {lastTrain.exercises.length > 3 && <span style={{ fontSize: 10, color: "#64748b", padding: "2px 4px" }}>+{lastTrain.exercises.length - 3}</span>}
                </div>
              )}
            </div>
            {lastTrain.total_minutes > 0 && (
              <div style={{ fontSize: 13, fontWeight: 800, color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 99, padding: "4px 12px" }}>{lastTrain.total_minutes} min</div>
            )}
          </div>
        </div>
      )}

      {/* TRÄNINGSNOTISER */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>TRÄNINGSNOTISER</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <StableInput value={trainNoteInput} onChange={e => setTrainNoteInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addNote(); }} placeholder="Något att ta upp på träning..." style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "9px 12px", fontFamily: "inherit", outline: "none" }} />
          <button onClick={addNote} style={{ padding: "9px 14px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, color: "#22c55e", fontSize: 18, fontFamily: "inherit", cursor: "pointer", fontWeight: 300 }}>+</button>
        </div>
        {trainNotes.map(n => (
          <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 10, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", marginTop: 5, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#cbd5e1", flex: 1, lineHeight: 1.5 }}>{n.text}</span>
            <button onClick={() => { sbDel("training_notes", n.id, tok); setTrainNotes(p => p.filter(x => x.id !== n.id)); }} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, padding: 0, flexShrink: 0, lineHeight: 1 }}>×</button>
          </div>
        ))}
        {trainNotes.length === 0 && <div style={{ fontSize: 12, color: "#475569", textAlign: "center", padding: "4px 0" }}>Inga notiser</div>}
      </div>

    </div>
  );
}
