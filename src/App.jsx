import { useState, useEffect, useCallback } from "react";
import ls from "./lib/storage.js";
import { sbAuth, sbGet, sbPost, sbPatch, sbDel } from "./lib/supabase.js";
import { CHECKLIST_INIT, ROADMAP_INIT } from "./lib/constants.js";
import { useMatchSession } from "./hooks/useMatchSession.js";
import { useSeasonStats } from "./hooks/useSeasonStats.js";
import AuthScreen from "./components/auth/AuthScreen.jsx";
import NoteModal from "./components/players/NoteModal.jsx";
import GoalModal from "./components/players/GoalModal.jsx";
import KedjorTab from "./components/training/KedjorTab.jsx";
import PlaneraTab from "./components/training/PlaneraTab.jsx";
import OvningarTab from "./components/training/OvningarTab.jsx";
import HomeContent from "./components/home/HomeContent.jsx";
import MatchContent from "./components/match/MatchContent.jsx";
import MatchNoteModal from "./components/match/MatchNoteModal.jsx";
import MerContent from "./components/mer/MerContent.jsx";
import BottomNav from "./components/ui/BottomNav.jsx";

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

  // UI
  const [tab,setTab]=useState("home");
  const [merSub,setMerSub]=useState(null);
  const [trainSub,setTrainSub]=useState("kedjor");
  const [openPeriod,setOpenPeriod]=useState(null);
  const [filterGroup,setFilterGroup]=useState("ALL");
  const [noteModal,setNoteModal]=useState(null);
  const [matchNoteModal,setMatchNoteModal]=useState(null);
  const [goalModal,setGoalModal]=useState(null);
  const [trainNoteInput,setTrainNoteInput]=useState("");
  const [pendingCoaches,setPendingCoaches]=useState([]);

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
  const{nextMatch,setNextMatch,matchStep,setMatchStep,activeMatch}=matchSession;

  // LOAD DATA
  const loadData=useCallback(async()=>{
    if(!clubId||!tok)return;
    setLoadingApp(true);
    try{
      const[pl,ma,tr,tn,ex]=await Promise.all([
        sbGet("players","club_id=eq."+clubId+"&order=name.asc",tok),
        sbGet("matches","club_id=eq."+clubId+"&order=date.desc",tok),
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
    setLoadingApp(false);
  },[clubId,tok]);

  useEffect(()=>{if(profile)loadData();},[profile]);

  // Load pending coaches if owner
  useEffect(()=>{
    if(profile?.role==="owner"&&clubId&&tok){
      sbGet("profiles","club_id=eq."+clubId+"&approved=eq.false&role=eq.coach&select=*",tok).then(r=>{if(Array.isArray(r))setPendingCoaches(r);});
    }
  },[profile]);

  // Load profile on startup
  useEffect(()=>{
    if(auth?.tok&&!profile){
      sbGet("profiles","id=eq."+auth.uid+"&select=*,clubs(*)",auth.tok).then(res=>{
        if(Array.isArray(res)&&res[0])setProfile(res[0]);
        else{ls.clear();setAuth(null);}
      });
    }
  },[auth]);

  const handleAuth=({tok,uid,profile:p})=>{
    ls.set("hibs_token",tok);ls.set("hibs_uid",uid);
    setAuth({tok,uid});setProfile(p);
  };

  const handleSignOut=async()=>{
    if(tok)await sbAuth("logout",{}).catch(()=>{});
    ls.clear();
    setAuth(null);setProfile(null);setPlayers([]);setHistory([]);setTrainHistory([]);setTrainNotes([]);setExercises([]);
  };

  // SEASON STATS — must be before early returns (Rules of Hooks)
  const{stats,totalGoals,totalAssists,latestMatch}=useSeasonStats(history);

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
      {goalModal&&<GoalModal player={goalModal} onClose={()=>setGoalModal(null)} onSave={async goals=>{await updP(goalModal.id,{goals});setGoalModal(null);}}/>}
      <MatchNoteModal match={matchNoteModal} onClose={()=>setMatchNoteModal(null)} onSave={async txt=>{await sbPatch("matches",matchNoteModal.id,{note:txt},tok);setHistory(p=>p.map(m=>m.id===matchNoteModal.id?{...m,note:txt}:m));setMatchNoteModal(null);}}/>

      <div style={{position:"sticky",top:0,background:"rgba(11,13,20,0.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 20px",zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:"-0.3px"}}>HIBS Tränarapp</div>
          <div style={{fontSize:11,color:"#4a5568",marginTop:2}}>{profile?.clubs?.name||"P2015"} - {profile?.username||"Tränare"}</div>
        </div>
        {tab==="mer"&&!merSub
          ?<button onClick={handleSignOut} style={{fontSize:11,color:"#f87171",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Logga ut</button>
          :tab==="mer"&&merSub
          ?<button onClick={()=>setMerSub(null)} style={{fontSize:12,color:"#4a5568",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Tillbaka</button>
          :null
        }
      </div>

      <div style={{padding:"16px 16px 0"}}>
        {tab==="traning"&&(
          <div style={{display:"flex",gap:6,marginBottom:16}}>
            {[["kedjor","Kedjor"],["planera","Planera"],["ovningar","Övningar"]].map(([id,label])=>(
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
          injured={injured} nextMatch={nextMatch} setNextMatch={setNextMatch}
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
        {tab==="match"&&<MatchContent
          {...matchSession}
          players={players} gkPlayers={gkPlayers} field={field}
        />}
        {tab==="mer"&&<MerContent
          pendingCoaches={pendingCoaches} setPendingCoaches={setPendingCoaches}
          merSub={merSub} setMerSub={setMerSub}
          players={players} filterGroup={filterGroup} setFilterGroup={setFilterGroup}
          setNoteModal={setNoteModal} setGoalModal={setGoalModal}
          checklist={checklist} setChecklist={setChecklist}
          history={history} setHistory={setHistory}
          setMatchNoteModal={setMatchNoteModal}
          roadmap={roadmap} setRoadmap={setRoadmap}
          openPeriod={openPeriod} setOpenPeriod={setOpenPeriod}
          tok={tok} sbPatch={sbPatch} sbDel={sbDel}
        />}
      </div>

      <BottomNav tab={tab} setTab={setTab} setMerSub={setMerSub}/>
    </div>
  );
}
