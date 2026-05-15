import TeamMessages from "./TeamMessages.jsx";
import MatchHistoryView from "./MatchHistoryView.jsx";
import GrupperDnD from "./GrupperDnD.jsx";
import FeedbackTrend from "./FeedbackTrend.jsx";
import ParentInvite from "./ParentInvite.jsx";
import PlayerListView from "./PlayerListView.jsx";
import ChecklistView from "./ChecklistView.jsx";
import SeasonPlanView from "./SeasonPlanView.jsx";

/**
 * MerContent — "Mer"-fliken med spelare, lagmål, matchhistorik, säsongsplan.
 * Extraherad från App.jsx i Sprint 3.
 * Sprint 11: P10 fitness-badge + P9 observations-knapp tillagda.
 */
export default function MerContent({
  pendingCoaches, setPendingCoaches,
  coachStaff, setCoachStaff,
  merSub, setMerSub,
  players, filterGroup, setFilterGroup,
  setNoteModal, setGoalModal, setObsModal,
  checklist, setChecklist,
  history, setHistory, setMatchNoteModal,
  roadmap, setRoadmap, openPeriod, setOpenPeriod,
  tok, sbPatch, sbDel, updP,
  clubId, uid, profile,
}) {
  return (
    <div>
      {pendingCoaches.length > 0 && !merSub && (
        <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700, marginBottom: 10 }}>VÄNTANDE TRÄNARE</div>
          {pendingCoaches.map(pc => (
            <div key={pc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>{pc.username}</span>
              <button onClick={async () => {
                await sbPatch("profiles", pc.id, { approved: true }, tok);
                setPendingCoaches(p => p.filter(x => x.id !== pc.id));
                if (setCoachStaff) setCoachStaff(prev => [...prev, { id: pc.id, username: pc.username, role: "coach" }]);
              }} style={{ padding: "6px 14px", border: "none", borderRadius: 99, background: "#22c55e", color: "#0b0d14", fontSize: 11, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>Godkänn</button>
            </div>
          ))}
        </div>
      )}
      {!merSub && (
        <FeedbackTrend
          clubId={clubId}
          tok={tok}
          coaches={[
            ...(profile ? [{ id: profile.id, username: profile.username || "Du" }] : []),
            ...(coachStaff || []),
          ]}
        />
      )}
      {!merSub && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["meddelanden",   "💬", "Meddelanden",        "Lagmeddelanden mellan tränare"],
            ["spelare",       "👥", "Spelarlista",        "Se alla spelare, noter och observationer"],
            ["grupper",       "🔀", "Grupper & kedjor",   "Placera spelare i grupp A, B, C eller MV"],
            ["lagmal",        "🎯", "Lagmål och checklist","Säsongens mål och checklistor"],
            ["matchhistorik", "📊", "Matchhistorik",      "Alla spelade matcher"],
            ["sasongsplan",   "🗓", "Säsongsplan",        "Periodsplan för säsongen"],
            ["foraldrainbjud","👪", "Bjud in föräldrar",  "Dela en länk så föräldrar kan logga in"],
          ].map(([id, icon, label, desc]) => (
            <button key={id} onClick={() => setMerSub(id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{label}</div>
                <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>{desc}</div>
              </div>
              <span style={{ marginLeft: "auto", color: "#4a5568", fontSize: 16, flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      )}

      {merSub === "meddelanden" && (
        <TeamMessages clubId={clubId} uid={uid} tok={tok} profile={profile} />
      )}

      {merSub === "foraldrainbjud" && (
        <ParentInvite clubId={clubId} />
      )}

      {merSub === "spelare" && (
        <PlayerListView
          players={players} filterGroup={filterGroup} setFilterGroup={setFilterGroup}
          setNoteModal={setNoteModal} setGoalModal={setGoalModal} setObsModal={setObsModal}
          updP={updP}
        />
      )}

      {merSub === "grupper" && <GrupperDnD players={players} updP={updP} />}

      {merSub === "lagmal" && (
        <ChecklistView checklist={checklist} setChecklist={setChecklist} />
      )}

      {merSub === "matchhistorik" && (
        <MatchHistoryView
          history={history} setHistory={setHistory}
          players={players} tok={tok}
          setMatchNoteModal={setMatchNoteModal} sbDel={sbDel}
        />
      )}

      {merSub === "sasongsplan" && (
        <SeasonPlanView roadmap={roadmap} setRoadmap={setRoadmap} openPeriod={openPeriod} setOpenPeriod={setOpenPeriod} />
      )}
    </div>
  );
}
