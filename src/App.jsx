import { useState, useEffect, useCallback, useMemo } from "react";
import ls from "./lib/storage.js";
import { sbGet, sbPost, sbPatch, sbDel } from "./lib/supabase.js";
import { CHECKLIST_INIT, ROADMAP_INIT } from "./lib/constants.js";
import { useAuth } from "./hooks/useAuth.js";
import { useMatchSession } from "./hooks/useMatchSession.js";
import { useSeasonStats } from "./hooks/useSeasonStats.js";
import { useAttendance } from "./hooks/useAttendance.js";
import { useLiveMatchPoll } from "./hooks/useLiveMatchPoll.js";
import AuthScreen from "./components/auth/AuthScreen.jsx";
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
import MerContent from "./components/mer/MerContent.jsx";
import BottomNav from "./components/ui/BottomNav.jsx";
import ProfilePanel from "./components/ui/ProfilePanel.jsx";
import LiveMatchBanner from "./components/ui/LiveMatchBanner.jsx";
import AppHeader from "./components/ui/AppHeader.jsx";

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
  const clubId=profile?.club_id;

  // MATCH SESSION HOOK (encapsulates all match state, persistence & actions)
  const matchSession=useMatchSession({clubId,tok,auth,players,setPlayers,setHistory});
  const{upcomingMatches,addUpcoming,removeUpcoming,loadFromSchedule,updateUpcomingRsvp,matchStep,setMatchStep,activeMatch}=matchSession;

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
        sbGet("exercises","order=name.asc",tok),
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
  useEffect(()=>{
    if(!profile)return;
    const id=setInterval(()=>loadData(true),60*1000);
    return()=>clearInterval(id);
  },[profile,loadData]);

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

  // SEASON STATS — must be before early returns (Rules of Hooks)
  const{stats,keeperStats,shotStats,totalGoals,totalAssists,latestMatch}=useSeasonStats(history,players);

  // P12 ATTENDANCE — must be before early returns (Rules of Hooks)
  const { attendance, togglePlayer } = useAttendance();

  if(!auth||!profile)return<AuthScreen onAuth={handleAuth}/>;
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

      {/* ── Live match-banner (visas för co-tränare) ─────────────────── */}
      <LiveMatchBanner liveMatchView={liveMatchView} onNavigate={()=>setTab("match")}/>

      {/* ── Sticky header (AppHeader — Sprint 23 refactoring) ──────────── */}
      <AppHeader
        profile={profile}
        tab={tab}
        merSub={merSub}
        onBack={()=>setMerSub(null)}
        onProfileOpen={()=>setProfileOpen(true)}
      />

      <div style={{padding:"16px 16px 0"}}>
        {tab==="traning"&&(
          <div style={{display:"flex",gap:6,marginBottom:16}}>
            {[["kedjor","Kedjor"],["planera","Planera"],["ovningar","Övningar"],["tavla","🎨 Tavla"]].map(([id,label])=>(
              <button key={id} onClick={()=>setTrainSub(id)} style={{flex:1,padding:"9px 0",border:"1px solid "+(trainSub===id?"#22c55e":"rgba(255,255,255,0.07)"),borderRadius:10,background:trainSub===id?"rgba(34,197,94,0.1)":"transparent",color:trainSub===id?"#22c55e":"#4a5568",fontSize:12,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>{label}</button>
            ))}
          </div>
        )}
        {tab==="match"&&!activeMatch&&(
          <div style={{display:"flex",gap:6,marginBottom:16}}>
            {[["select","Trupp"],["lines","Kedjor"]].map(([id,label])=>(
              <button key={id} onClick={()=>setMatchStep(id)} style={{flex:1,padding:"9px 0",border:"1px solid "+(matchStep===id?"#22c55e":"rgba(255,255,255,0.07)"),borderRadius:10,background:matchStep===id?"rgba(34,197,94,0.1)":"transparent",color:matchStep===id?"#22c55e":"#4a5568",fontSize:12,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>{label}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{padding:"0 16px"}}>
        {tab==="home"&&<HomeContent
          injured={injured} upcomingMatches={upcomingMatches} addUpcoming={addUpcoming} removeUpcoming={removeUpcoming} updateUpcomingRsvp={updateUpcomingRsvp}
          latestMatch={latestMatch} stats={stats} totalGoals={totalGoals} totalAssists={totalAssists}
          history={history} players={players} trainHistory={trainHistory}
          trainNoteInput={trainNoteInput} setTrainNoteInput={setTrainNoteInput}
          trainNotes={trainNotes} setTrainNotes={setTrainNotes}
          clubId={clubId} uid={auth.uid} tok={tok}
        />}
        {tab==="traning"&&trainSub==="kedjor"&&<KedjorTab players={players} onUpdatePlayerGroup={async(id,group)=>{setPlayers(p=>p.map(x=>x.id===id?{...x,group}:x));await sbPatch("players",id,{group},tok);}}/>}
        {tab==="traning"&&trainSub==="planera"&&<PlaneraTab exercises={exercises} trainHistory={trainHistory}
          onSave={async entry=>{const row={club_id:clubId,date:entry.date,exercises:entry.exercises,total_minutes:entry.totalMinutes,note:entry.note||"",created_by:auth.uid};const saved=await sbPost("training_sessions",row,tok);const s=Array.isArray(saved)&&saved[0]?saved[0]:{...row,id:Date.now()};setTrainHistory(p=>[s,...p]);}}
          onDelete={async id=>{await sbDel("training_sessions",id,tok);setTrainHistory(p=>p.filter(x=>x.id!==id));}}
          players={players}
          attendance={attendance}
          onToggleAttendance={togglePlayer}
        />}
        {tab==="traning"&&trainSub==="ovningar"&&<OvningarTab token={tok}/>}
        {tab==="traning"&&trainSub==="tavla"&&<TaktiktavlaTab/>}
        {tab==="match"&&<MatchContent
          {...matchSession}
          players={players} gkPlayers={gkPlayers} field={field}
        />}
        {tab==="stats"&&<StatsContent
          history={history} stats={stats} keeperStats={keeperStats} shotStats={shotStats}
          totalGoals={totalGoals} totalAssists={totalAssists}
          players={players} trainHistory={trainHistory}
          attendance={attendance}
        />}
        {tab==="mer"&&<MerContent
          pendingCoaches={pendingCoaches} setPendingCoaches={setPendingCoaches}
          coachStaff={coachStaff} setCoachStaff={setCoachStaff}
          merSub={merSub} setMerSub={setMerSub}
          players={players} filterGroup={filterGroup} setFilterGroup={setFilterGroup}
          setNoteModal={setNoteModal} setGoalModal={setGoalModal} setObsModal={setObsModal}
          checklist={checklist} setChecklist={setChecklist}
          history={history} setHistory={setHistory}
          setMatchNoteModal={setMatchNoteModal}
          roadmap={roadmap} setRoadmap={setRoadmap}
          openPeriod={openPeriod} setOpenPeriod={setOpenPeriod}
          tok={tok} sbPatch={sbPatch} sbDel={sbDel} updP={updP}
          clubId={clubId} uid={auth.uid} profile={profile}
        />}
      </div>

      <BottomNav tab={tab} setTab={(t)=>{setTab(t);if(t==="mer")markObsSeen();if(t!=="mer")setMerSub(null);}} setMerSub={setMerSub} merBadge={unreadObs+pendingCoaches.length}/>
    </div>
  );
}
