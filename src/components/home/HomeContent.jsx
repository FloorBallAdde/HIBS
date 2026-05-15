import StableInput from "../ui/StableInput.jsx";
import UpcomingMatchCard from "./UpcomingMatchCard.jsx";
import SeasonRecordHero from "./SeasonRecordHero.jsx";
import LatestMatchCard from "./LatestMatchCard.jsx";
import QuickStatsStrip from "./QuickStatsStrip.jsx";
import FormStrip from "./FormStrip.jsx";
import TopScorers from "./TopScorers.jsx";
import LatestTrainings from "./LatestTrainings.jsx";
import { sbPost, sbDel } from "../../lib/supabase.js";

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

      {/* HERO — SEASON RECORD (Sprint 38: extraherat till SeasonRecordHero) */}
      <SeasonRecordHero history={history} />

      {/* QUICK STATS STRIP — extraherad till QuickStatsStrip (Sprint 40) */}
      <QuickStatsStrip
        totalGoals={totalGoals}
        totalAssists={totalAssists}
        history={history}
        trainHistory={trainHistory}
      />

      {/* FORM — extraherad till FormStrip (Sprint 41) */}
      <FormStrip history={history} />

      {/* NÄSTA MATCH — extraherad till UpcomingMatchCard (Sprint 15) */}
      <UpcomingMatchCard
        upcomingMatches={upcomingMatches}
        addUpcoming={addUpcoming}
        removeUpcoming={removeUpcoming}
        updateUpcomingRsvp={updateUpcomingRsvp}
        players={players}
      />

      {/* SENASTE MATCH — extraherad till LatestMatchCard (Sprint 39) */}
      <LatestMatchCard latestMatch={latestMatch} />

      {/* TOP 3 SCORERS — extraherad till TopScorers (Sprint 42) */}
      <TopScorers stats={stats} players={players} />

      {/* SENASTE TRÄNINGAR — extraherad till LatestTrainings (Sprint 43) */}
      <LatestTrainings trainHistory={trainHistory} />

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
