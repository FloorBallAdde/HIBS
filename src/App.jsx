import { useState, useEffect, useCallback, useMemo } from "react";
import ls from "./lib/storage.js";
import { sbGet, sbPost, sbPatch, sbDel } from "./lib/supabase.js";
import { CHECKLIST_INIT, ROADMAP_INIT, CURRENT_SEASON, matchSeason } from "./lib/constants.js";
import { AppCtx } from "./lib/AppContext.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { useMatchSession } from "./hooks/useMatchSession.js";
import { useSeasonStats } from "./hooks/useSeasonStats.js";
import { useAttendance } from "./hooks/useAttendance.js";
import { useLiveMatchPoll } from "./hooks/useLiveMatchPoll.js";
import { usePoll } from "./hooks/usePoll.js";
import AuthScreen from "./components/auth/AuthScreen.jsx";
import PostMatchFeedback from "./components/ui/PostMatchFeedback.jsx";
import NoteModal from "./components/players/NoteModal.jsx";
import GoalModal from "./components/players/GoalModal.jsx";
import ObservationModal from "./components/players/ObservationModal.jsx";
import KedjorTab from "./components/training/KedjorTab.jsx";
import PlaneraTab from "./components/training/PlaneraTab.jsx";
import OvningarTab from "./components/training/OvningarTab.jsx";
import TaktiktavlaTab from "./components/training/TaktiktavlaTab.jsx";
import HomeContent from "./components/home/HomeContent.jsx";
import StatsContent from "./components/stats/StatsContent.jsx";
import MatchContent from "./components/match/MatchContent.jsx";
import MatchNoteModal from "./components/match/MatchNoteModal.jsx";
import MatchLessonsModal from "./components/match/MatchLessonsModal.jsx";
import QuickNoteSheet from "./components/ui/QuickNoteSheet.jsx";
import MerContent from "./components/mer/MerContent.jsx";
import BottomNav from "./components/ui/BottomNav.jsx";
import ProfilePanel from "./components/ui/ProfilePanel.jsx";
import LiveMatchBanner from "./components/ui/LiveMatchBanner.jsx";
import OfflineBanner from "./components/ui/OfflineBanner.jsx";
import AppHeader from "./components/ui/AppHeader.jsx";
import SubTabBar from "./components/ui/SubTabBar.jsx";
import ParentView from "./components/home/ParentView.jsx";

// MAIN APP
export default function App(){
  // AUTH (Sprint 26: extraherad till useAuth-hook)
  const{auth,profile,pendingCoaches,setPendingCoaches,coachStaff,setCoachStaff,handleAuth,handleSignOut,updateClub}=useAuth();
  const [loadingApp,setLoadingApp]=useState(false);

  // UI
  const [tab,setTab]=useState("home");
  const [merSub,setMerSub]=useState(null);
  const [trainSub,setTrainSub]=useState("kedjor");
  const [openPeriod,setOpenPeriod]=useState(null);
  const [filterGroup,setFilterGroup]=useState("ALL");
  const [noteModal,setNoteModal]=useState(null);
  const [matchNoteModal,setMatchNoteModal]=useState(null);
  const [goalModal,setGoalModal]=useState(null);
  const [obsModal,setObsModal]=useState(null); // P9: Spelarobservationer
  const [profileOpen,setProfileOpen]=useState(false); // Profilpanel i header
  const [trainNoteInput,setTrainNoteInput]=useState("");
  const [lastSeenObs,setLastSeenObs]=useState(()=>ls.get("hibs_obs_seen")||"");

  // DATA
  const [players,setPlayers]=useState([]);
  const [history,setHistory]=useState([]);
  const [trainHistory,setTrainHistory]=useState([]);
  const [trainNotes,setTrainNotes]=useState([]);
  const [exercises,setExercises]=useState([]);

  // LOCAL-ONLY STATE (checklist, roadmap)
  const [checklist,setChecklist]=useState(()=>{
    const s=ls.get("hibs_check3",null);
    if(!s)return CHECKLIST_INIT;
    return CHECKLIST_INIT.map((cat,ci)=>({...cat,items:cat.items.map(item=>{const sc=s[ci];const si=sc&&sc.items?sc.items.find(x=>x.id===item.id):null;return si?{...item,done:si.done}:item;})}));
  });
  const [roadmap,setRoadmap]=useState(()=>{
    const s=ls.get("hibs_road2",null);
    if(!s)return ROADMAP_INIT;
    return ROADMAP_INIT.map((period,pi)=>({...period,tasks:period.tasks.map(task=>{const sp=s[pi];const st=sp&&sp.tasks?sp.tasks.find(x=>x.id===task.id):null;return st?{...task,done:st.done}:task;})}));
  });

  // PERSIST LOCAL STATE
  useEffect(()=>{ls.set("hibs_check3",checklist);},[checklist]);
  useEffect(()=>{ls.set("hibs_road2",roadmap);},[roadmap]);

  const tok=auth?.tok;
  const [showFeedback, setShowFeedback] = useState(false);
  const [showLessons, setShowLessons] = useState(false); // Sprint 75: "Vad såg du?" efter match
  const [showQuickNote, setShowQuickNote] = useState(false); // Sprint 76: 🧠 snabbanteckning
  const clubId=profile?.club_id;

  // MATCH SESSION HOOK (encapsulates all match state, persistence & actions)
  // Sprint 75: matchslut → först lärdomsmodal, sedan feedback-overlay
  const matchSession=useMatchSession({clubId,tok,auth,players,setPlayers,setHistory,onMatchEnded:()=>setShowLessons(true)});
  const{upcomingMatches,addUpcoming,removeUpcoming,updateUpcomingRsvp}=matchSession; // Sprint 69: matchStep-nav flyttad in i MatchContent

  // LOAD DATA — silent=true används vid bakgrundspolling (ingen spinner, ingen scroll-reset)
  const loadData=useCallback(async(silent=false)=>{
    if(!clubId||!tok)return;
    if(!silent)setLoadingApp(true);
    try{
      const[pl,ma,tr,tn,ex]=await Promise.all([
        sbGet("players","club_id=eq."+clubId+"&order=name.asc",tok),
        sbGet("matches","club_id=eq."+clubId+"&is_upcoming=eq.false&order=date.desc",tok),
        sbGet("training_sessions","club_id=eq."+clubId+"&order=date.desc",tok),
        sbGet("training_notes","club_id=eq."+clubId+"&order=created_at.desc",tok),
        // Sprint 67: lätt kolumnlista (utan canvas_drawing-blobbar) — samma som OvningarTab
        // tidigare hämtade. Detta är nu appens ENDA övningsladdning (dubbelladdningen borta).
        sbGet("exercises","select=id,name,category,intensity,players,vad,varfor,hur,organisation,tips,coaching_fragor,has_drawing&order=name.asc",tok),
      ]);
      if(Array.isArray(pl))setPlayers(pl.map(p=>({...p,goals:p.goals||[]})));
      if(Array.isArray(ma))setHistory(ma);
      if(Array.isArray(tr))setTrainHistory(tr);
      if(Array.isArray(tn))setTrainNotes(tn);
      if(Array.isArray(ex))setExercises(ex);
    }catch(e){console.error(e);}
    if(!silent)setLoadingApp(false);
  },[clubId,tok]);

  useEffect(()=>{if(profile)loadData();},[profile]);

  // Polling: uppdatera spelardata var 60s (för delade observationer mellan tränare)
  // (Sprint 57: via usePoll — pausar när fliken är dold/offline, refetch vid wake)
  usePoll(()=>loadData(true),60*1000,!!profile);

  // Räkna olästa observationer (gjorda av ANDRA tränare, nyare än lastSeenObs)
  const unreadObs=useMemo(()=>{
    if(!auth?.uid)return 0;
    let n=0;
    players.forEach(p=>{
      if(Array.isArray(p.observations)){
        p.observations.forEach(o=>{
          if(o.authorId&&o.authorId!==auth.uid&&(!lastSeenObs||o.createdAt>lastSeenObs))n++;
        });
      }
    });
    return n;
  },[players,auth?.uid,lastSeenObs]);

  const markObsSeen=useCallback(()=>{
    const now=new Date().toISOString();
    ls.set("hibs_obs_seen",now);
    setLastSeenObs(now);
  },[]);

  // Live-match från annan tränare (pollar var 10s via hook)
  const liveMatchView = useLiveMatchPoll({ clubId, tok, uid: auth?.uid });

  // Sign out: rensa app-data utöver auth (som hanteras av hooken)
  const onSignOut=useCallback(async()=>{
    await handleSignOut();
    setPlayers([]);setHistory([]);setTrainHistory([]);setTrainNotes([]);setExercises([]);
  },[handleSignOut]);

  // Sprint 78: säsongsfilter — Hem/Statistik visar vald säsong (default 26/27),
  // Mer→Matchhistorik visar fortfarande allt (arkiv).
  const[season,setSeason]=useState(CURRENT_SEASON);
  const seasonHistory=useMemo(
    ()=>season==="Alla"?history:history.filter(m=>matchSeason(m)===season),
    [history,season]
  );

  // SEASON STATS — must be before early returns (Rules of Hooks)
  const{stats,keeperStats,shotStats,totalGoals,totalAssists,latestMatch,playerTrends}=useSeasonStats(seasonHistory,players);

  // P12 ATTENDANCE — Sprint 56: Supabase-synkad (training_attendance) — must be before early returns (Rules of Hooks)
  const { attendance, togglePlayer } = useAttendance({ clubId, tok, uid: auth?.uid });

  if(!auth||!profile)return<AuthScreen onAuth={handleAuth}/>;
  // P11 Fas 2: Föräldrar ser en förenklad läsvy (ParentView)
  if(profile.role==="parent")return<ParentView profile={profile} auth={auth} onSignOut={onSignOut}/>;
  if(loadingApp)return(
    <div style={{minHeight:"100vh",background:"#0b0d14",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,fontFamily:"system-ui,sans-serif"}}>
      <div style={{fontSize:28,fontWeight:900,color:"#fff"}}>HIBS</div>
      <div style={{fontSize:12,color:"#4a5568"}}>Laddar...</div>
    </div>
  );

  // HELPERS
  const field=players.filter(p=>p.role!=="malvakt");
  const gkPlayers=players.filter(p=>p.role==="malvakt");
  const injured=players.filter(p=>p.note&&p.note?.startsWith("⚠"));

  const updP=async(id,patch)=>{
    setPlayers(p=>p.map(x=>x.id===id?{...x,...patch}:x));
    await sbPatch("players",id,patch,tok);
  };

  return(
    <AppCtx.Provider value={{clubId,uid:auth.uid,tok,profile,players,setPlayers,updP}}>
    <div style={{minHeight:"100vh",background:"#0b0d14",fontFamily:"system-ui,sans-serif",color:"#fff",paddingBottom:72}}>
      {noteModal&&<NoteModal player={noteModal} onClose={()=>setNoteModal(null)} onSave={async text=>{await updP(noteModal.id,{note:text});setNoteModal(null);}}/>}
      {goalModal&&<GoalModal player={goalModal} onClose={()=>setGoalModal(null)} onSave={async goals=>{await updP(goalModal.id,{goals});}}/>}
      {obsModal&&<ObservationModal player={obsModal} profile={profile} onClose={()=>setObsModal(null)} onSave={async observations=>{await updP(obsModal.id,{observations});setObsModal(p=>p?{...p,observations}:null);}}/>}
      <MatchNoteModal key={matchNoteModal?.id} match={matchNoteModal} onClose={()=>setMatchNoteModal(null)} onSave={async txt=>{await sbPatch("matches",matchNoteModal.id,{note:txt},tok);setHistory(p=>p.map(m=>m.id===matchNoteModal.id?{...m,note:txt}:m));setMatchNoteModal(null);}}/>

      {/* ── Profilpanel ─────────────────────────────────────────────── */}
      <ProfilePanel
        profile={profile}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        coachStaff={coachStaff}
        pendingCoaches={pendingCoaches}
        onSignOut={onSignOut}
        onUpdateClub={updateClub}
      />

      {/* ── Offline-banner (Sprint 57: förklarar rollbackade skrivningar) ── */}
      <OfflineBanner/>

      {/* ── Live match-banner (visas för co-tränare) ─────────────────── */}
      <LiveMatchBanner liveMatchView={liveMatchView} onNavigate={()=>setTab("match")}/>

      {/* ── Sticky header (AppHeader — Sprint 23 refactoring) ──────────── */}
      <AppHeader
        profile={profile}
        tab={tab}
        merSub={merSub}
        onBack={()=>setMerSub(null)}
        onProfileOpen={()=>setProfileOpen(true)}
        onQuickNote={()=>setShowQuickNote(true)}
      />

      {/* Sprint 76: snabbanteckning från var som helst */}
      {showQuickNote && <QuickNoteSheet onSaved={n=>setTrainNotes(p=>[n,...p])} onClose={()=>setShowQuickNote(false)} />}

      <div style={{padding:"16px 16px 0"}}>
        {tab==="traning"&&(
          <SubTabBar
            tabs={[["kedjor","Kedjor"],["planera","Planera"],["ovningar","Övningar"],["tavla","🎨 Tavla"]]}
            current={trainSub}
            onChange={setTrainSub}
          />
        )}
        {/* Sprint 69: match-SubTabBar borttagen — MatchStepBar inne i MatchContent äger navigationen */}
      </div>

      <div style={{padding:"0 16px"}}>
        {tab==="home"&&<HomeContent
          injured={injured} upcomingMatches={upcomingMatches} addUpcoming={addUpcoming} removeUpcoming={removeUpcoming} updateUpcomingRsvp={updateUpcomingRsvp}
          latestMatch={latestMatch} stats={stats} totalGoals={totalGoals} totalAssists={totalAssists}
          history={seasonHistory} players={players} trainHistory={trainHistory}
          trainNoteInput={trainNoteInput} setTrainNoteInput={setTrainNoteInput}
          trainNotes={trainNotes} setTrainNotes={setTrainNotes}
          onGoMatch={()=>setTab("match")}
          onOpenMessages={()=>{setTab("mer");setMerSub("meddelanden");}}
        />}
        {tab==="traning"&&trainSub==="kedjor"&&<KedjorTab players={players} onUpdatePlayerGroup={async(id,group)=>{setPlayers(p=>p.map(x=>x.id===id?{...x,group}:x));await sbPatch("players",id,{group},tok);}}/>}
        {tab==="traning"&&trainSub==="planera"&&<PlaneraTab exercises={exercises} trainHistory={trainHistory}
          onSave={async entry=>{const row={club_id:clubId,date:entry.date,exercises:entry.exercises,total_minutes:entry.totalMinutes,note:entry.note||"",created_by:auth.uid};const saved=await sbPost("training_sessions",row,tok);const s=Array.isArray(saved)&&saved[0]?saved[0]:{...row,id:Date.now()};setTrainHistory(p=>[s,...p]);}}
          onDelete={async id=>{await sbDel("training_sessions",id,tok);setTrainHistory(p=>p.filter(x=>x.id!==id));}}
          players={players}
          attendance={attendance}
          onToggleAttendance={togglePlayer}
          matchFuel={seasonHistory[0]?.note ? { opponent: seasonHistory[0].opponent, date: seasonHistory[0].date, note: seasonHistory[0].note } : null}
          trainNotes={trainNotes}
        />}
        {tab==="traning"&&trainSub==="ovningar"&&<OvningarTab token={tok} exercises={exercises} setExercises={setExercises}/>}
        {tab==="traning"&&trainSub==="tavla"&&<TaktiktavlaTab/>}
        {tab==="match"&&<MatchContent
          {...matchSession}
          players={players} gkPlayers={gkPlayers} field={field}
        />}
        {tab==="stats"&&<StatsContent
          history={seasonHistory} stats={stats} keeperStats={keeperStats} shotStats={shotStats} playerTrends={playerTrends}
          totalGoals={totalGoals} totalAssists={totalAssists}
          players={players} trainHistory={trainHistory}
          attendance={attendance}
          season={season} setSeason={setSeason}
        />}
        {/* Sprint 72: clubId/uid/tok/profile/players/updP + sbPatch/sbDel via AppContext/imports */}
        {tab==="mer"&&<MerContent
          pendingCoaches={pendingCoaches} setPendingCoaches={setPendingCoaches}
          coachStaff={coachStaff} setCoachStaff={setCoachStaff}
          merSub={merSub} setMerSub={setMerSub}
          filterGroup={filterGroup} setFilterGroup={setFilterGroup}
          setNoteModal={setNoteModal} setGoalModal={setGoalModal} setObsModal={setObsModal}
          checklist={checklist} setChecklist={setChecklist}
          history={history} setHistory={setHistory}
          setMatchNoteModal={setMatchNoteModal}
          roadmap={roadmap} setRoadmap={setRoadmap}
          openPeriod={openPeriod} setOpenPeriod={setOpenPeriod}
        />}
      </div>

      {showLessons && <MatchLessonsModal match={history[0]} setHistory={setHistory} onClose={()=>{setShowLessons(false);setShowFeedback(true);}} />}
      {showFeedback && <PostMatchFeedback onClose={()=>setShowFeedback(false)} clubId={clubId} uid={auth?.uid} />}
      <BottomNav tab={tab} setTab={(t)=>{setTab(t);if(t==="mer")markObsSeen();if(t!=="mer")setMerSub(null);}} setMerSub={setMerSub} merBadge={unreadObs+pendingCoaches.length}/>
    </div>
    </AppCtx.Provider>
  );
}
