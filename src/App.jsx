import { useState, useEffect, useCallback, useMemo } from "react";
import ls from "./lib/storage.js";
import { sbAuth, sbGet, sbPost, sbPatch, sbDel, sbRefresh } from "./lib/supabase.js";
import { CHECKLIST_INIT, ROADMAP_INIT } from "./lib/constants.js";
import { useMatchSession } from "./hooks/useMatchSession.js";
import { useSeasonStats } from "./hooks/useSeasonStats.js";
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

// MAIN APP
export default function App(){
  // AUTH
  const [auth,setAuth]=useState(()=>{
    const tok=ls.get("hibs_token",null);
    const uid=ls.get("hibs_uid",null);
    if(!tok||!uid)return null;
    return{tok,uid};
  });
  const [profile,setProfile]=useState(null);
  const [loadingApp,setLoadingApp]=useState(false);

  // AUTO-REFRESH: förnya JWT var 50:e minut så den aldrig hinner gå ut under en matchdag
  useEffect(()=>{
    const refresh = async () => {
      const rt = ls.get("hibs_refresh", null);
      if (!rt) return;
      const res = await sbRefresh(rt);
      if (res?.access_token) {
        ls.set("hibs_token", res.access_token);
        if (res.refresh_token) ls.set("hibs_refresh", res.refresh_token);
        setAuth(a => a ? { ...a, tok: res.access_token } : a);
      }
    };
    refresh(); // kör direkt vid start för att fräscha upp en ev. gammal token
    const id = setInterval(refresh, 50 * 60 * 1000); // var 50 min
    return () => clearInterval(id);
  }, []);

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
  const [pendingCoaches,setPendingCoaches]=useState([]);
  const [coachStaff,setCoachStaff]=useState([]); // Godkända tränare i samma klubb
  const [lastSeenObs,setLastSeenObs]=useState(()=>ls.get("hibs_obs_seen")||"");
  const [liveMatchView,setLiveMatchView]=useState(null); // Live-match från annan tränare

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

  // Poll för live-match från annan tränare (var 10s)
  useEffect(()=>{
    if(!clubId||!tok)return;
    const poll=async()=>{
      const res=await sbGet("matches","club_id=eq."+clubId+"&is_live=eq.true&select=id,opponent,live_state,created_by",tok);
      if(Array.isArray(res)&&res.length>0){
        // Visa bara om det är en ANNAN tränares match
        const other=res.find(m=>m.created_by!==auth?.uid);
        setLiveMatchView(other||null);
      } else {
        setLiveMatchView(null);
      }
    };
    poll();
    const id=setInterval(poll,10000);
    return()=>clearInterval(id);
  },[clubId,tok,auth?.uid]);

  // Load pending coaches if owner
  useEffect(()=>{
    if((profile?.role==="owner"||profile?.role==="admin")&&clubId&&tok){
      sbGet("profiles","club_id=eq."+clubId+"&approved=eq.false&role=eq.coach&select=*",tok).then(r=>{if(Array.isArray(r))setPendingCoaches(r);});
      sbGet("profiles","club_id=eq."+clubId+"&approved=eq.true&id=neq."+auth.uid+"&select=id,username,role",tok).then(r=>{if(Array.isArray(r))setCoachStaff(r);});
    }
  },[profile]);

  // Load profile on startup — hämtar klubb separat (ingen FK-join nödvändig)
  useEffect(()=>{
    if(auth?.tok&&!profile){
      sbGet("profiles","id=eq."+auth.uid+"&select=*",auth.tok).then(async res=>{
        if(Array.isArray(res)&&res[0]){
          const p=res[0];
          if(p.club_id){
            const club=await sbGet("clubs","id=eq."+p.club_id,auth.tok);
            if(Array.isArray(club)&&club[0])p.clubs=club[0];
          }
          setProfile(p);
        } else{
          ["hibs_token","hibs_uid","hibs_refresh"].forEach(k=>ls.remove(k));
          setAuth(null);
        }
      });
    }
  },[auth]);

  const handleAuth=({tok,uid,profile:p})=>{
    ls.set("hibs_token",tok);ls.set("hibs_uid",uid);
    setAuth({tok,uid});setProfile(p);
  };

  const handleSignOut=async()=>{
    if(tok)await sbAuth("logout",{}).catch(()=>{});
    // Clear only auth & session keys — preserve checklist/roadmap local state
    ["hibs_token","hibs_uid","hibs_refresh",
     "hibs_active","hibs_result","hibs_scorers","hibs_lines2",
     "hibs_reserves2","hibs_sel2","hibs_mdate2","hibs_opp2",
     "hibs_serie2","hibs_gk2","hibs_team_goals","hibs_match_shots",
     "hibs_match_shots_for","hibs_live_match_id","hibs_cup_mode",
     "hibs_subs","hibs_upcoming"].forEach(k=>ls.remove(k));
    setAuth(null);setProfile(null);setPlayers([]);setHistory([]);setTrainHistory([]);setTrainNotes([]);setExercises([]);
  };

  // SEASON STATS — must be before early returns (Rules of Hooks)
  const{stats,keeperStats,shotStats,totalGoals,totalAssists,latestMatch}=useSeasonStats(history,players);

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
        onSignOut={handleSignOut}
        onUpdateClub={async(patch)=>{
          if(!profile?.club_id||!tok)return;
          await sbPatch("clubs",profile.club_id,patch,tok);
          setProfile(p=>p?{...p,clubs:{...p.clubs,...patch}}:p);
        }}
      />

      {/* ── Live match-banner (visas för co-tränare) ─────────────────── */}
      {liveMatchView&&(
        <div onClick={()=>setTab("match")} style={{background:"rgba(239,68,68,0.12)",borderBottom:"1px solid rgba(239,68,68,0.3)",padding:"10px 20px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"pulse 1s infinite"}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>🔴 LIVE — HIBS vs {liveMatchView.opponent}</div>
            {liveMatchView.live_state&&(
              <div style={{fontSize:12,color:"#fca5a5",marginTop:1}}>
                {liveMatchView.live_state.result?.us||0} – {liveMatchView.live_state.result?.them||0}
                {" · "}Skott: {liveMatchView.live_state.shots_for||0}–{liveMatchView.live_state.shots||0}
              </div>
            )}
          </div>
          <span style={{fontSize:11,color:"#f87171"}}>Se matchen ›</span>
        </div>
      )}

      {/* ── Sticky header ───────────────────────────────────────────── */}
      <div style={{position:"sticky",top:0,background:"rgba(11,13,20,0.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 20px",zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:16,fontWeight:900,color:"#fff",letterSpacing:"-0.3px"}}>{profile?.clubs?.name||"HIBS Tränarapp"}</div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
            <span style={{fontSize:10,color:profile?.role==="owner"?"#a78bfa":profile?.role==="admin"?"#60a5fa":"#22c55e",fontWeight:700,background:profile?.role==="owner"?"rgba(167,139,250,0.1)":profile?.role==="admin"?"rgba(96,165,250,0.1)":"rgba(34,197,94,0.1)",padding:"2px 7px",borderRadius:99,border:"1px solid "+(profile?.role==="owner"?"rgba(167,139,250,0.3)":profile?.role==="admin"?"rgba(96,165,250,0.3)":"rgba(34,197,94,0.3)")}}>
              {profile?.role==="owner"?"👑 Ägare":profile?.role==="admin"?"⚡ Admin":"🏒 Tränare"}
            </span>
            <span style={{fontSize:10,color:"#4a5568"}}>{profile?.username||""}</span>
          </div>
        </div>
        {tab==="mer"&&merSub
          ?<button onClick={()=>setMerSub(null)} style={{fontSize:12,color:"#4a5568",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>‹ Tillbaka</button>
          :<button
            onClick={()=>setProfileOpen(true)}
            title="Profil & inbjudan"
            style={{width:36,height:36,borderRadius:10,background:"rgba(167,139,250,0.15)",border:"1.5px solid rgba(167,139,250,0.3)",color:"#a78bfa",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",fontWeight:900,flexShrink:0,overflow:"hidden",padding:0}}
          >
            {profile?.clubs?.logo_url
              ?<img src={profile.clubs.logo_url} alt="" onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}} style={{width:"100%",height:"100%",objectFit:"contain",padding:4,boxSizing:"border-box"}}/>
              :null}
            <span style={{display:profile?.clubs?.logo_url?"none":"flex"}}>{(profile?.username||"T")[0].toUpperCase()}</span>
          </button>
        }
      </div>

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
        />}
      </div>

      <BottomNav tab={tab} setTab={(t)=>{setTab(t);if(t==="mer")markObsSeen();if(t!=="mer")setMerSub(null);}} setMerSub={setMerSub} merBadge={unreadObs+pendingCoaches.length}/>
    </div>
  );
}
