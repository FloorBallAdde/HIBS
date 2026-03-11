import { useState, useEffect, useCallback } from "react";
import ls from "./lib/storage.js";
import { sbAuth, sbGet, sbPost, sbPatch, sbDel } from "./lib/supabase.js";
import {
  TODAY, mkLine, GC, gc,
  GROUPS, CHECKLIST_INIT, ROADMAP_INIT,
} from "./lib/constants.js";
import AuthScreen from "./components/auth/AuthScreen.jsx";
import NoteModal from "./components/players/NoteModal.jsx";
import GoalModal from "./components/players/GoalModal.jsx";
import MatchCard from "./components/match/MatchCard.jsx";
import KedjorTab from "./components/training/KedjorTab.jsx";
import PlaneraTab from "./components/training/PlaneraTab.jsx";
import OvningarTab from "./components/training/OvningarTab.jsx";
import HomeContent from "./components/home/HomeContent.jsx";
import MatchContent from "./components/match/MatchContent.jsx";

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
  const [matchStep,setMatchStep]=useState("select");
  const [trainSub,setTrainSub]=useState("kedjor");
  const [openPeriod,setOpenPeriod]=useState(null);
  const [filterGroup,setFilterGroup]=useState("ALL");
  const [noteModal,setNoteModal]=useState(null);
  const [matchNoteModal,setMatchNoteModal]=useState(null);
  const [goalModal,setGoalModal]=useState(null);
  const [trainNoteInput,setTrainNoteInput]=useState("");
  const [confirmAbort,setConfirmAbort]=useState(false);
  const [pendingCoaches,setPendingCoaches]=useState([]);

  // DATA
  const [players,setPlayers]=useState([]);
  const [history,setHistory]=useState([]);
  const [trainHistory,setTrainHistory]=useState([]);
  const [trainNotes,setTrainNotes]=useState([]);
  const [exercises,setExercises]=useState([]);

  // MATCH SESSION (localStorage – survives refresh mid-match)
  const [lines,setLines]=useState(()=>ls.get("hibs_lines2",[mkLine(1),mkLine(2),mkLine(3)]));
  const [reserves,setReserves]=useState(()=>ls.get("hibs_reserves2",[]));
  const [selected,setSelected]=useState(()=>new Set(ls.get("hibs_sel2",[])));
  const [matchDate,setMatchDate]=useState(()=>ls.get("hibs_mdate2",TODAY()));
  const [opponent,setOpponent]=useState(()=>ls.get("hibs_opp2",""));
  const [serie,setSerie]=useState(()=>ls.get("hibs_serie2","14A"));
  const [goalkeeper,setGoalkeeper]=useState(()=>ls.get("hibs_gk2",[])||[]);
  const [activeMatch,setActiveMatch]=useState(()=>ls.get("hibs_active",null));
  const [matchResult,setMatchResult]=useState(()=>ls.get("hibs_result",{us:"",them:""}));
  const [matchScorers,setMatchScorers]=useState(()=>ls.get("hibs_scorers",[])||[]);
  const [nextMatch,setNextMatch]=useState(()=>ls.get("hibs_next2",{opponent:"",date:"",serie:"14A"}));

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

  // PERSIST MATCH SESSION
  useEffect(()=>{ls.set("hibs_lines2",lines);},[lines]);
  useEffect(()=>{ls.set("hibs_reserves2",reserves);},[reserves]);
  useEffect(()=>{ls.set("hibs_sel2",[...selected]);},[selected]);
  useEffect(()=>{ls.set("hibs_mdate2",matchDate);},[matchDate]);
  useEffect(()=>{ls.set("hibs_opp2",opponent);},[opponent]);
  useEffect(()=>{ls.set("hibs_serie2",serie);},[serie]);
  useEffect(()=>{ls.set("hibs_gk2",goalkeeper);},[goalkeeper]);
  useEffect(()=>{ls.set("hibs_active",activeMatch);},[activeMatch]);
  useEffect(()=>{ls.set("hibs_result",matchResult);},[matchResult]);
  useEffect(()=>{ls.set("hibs_scorers",matchScorers);},[matchScorers]);
  useEffect(()=>{ls.set("hibs_next2",nextMatch);},[nextMatch]);
  useEffect(()=>{ls.set("hibs_check3",checklist);},[checklist]);
  useEffect(()=>{ls.set("hibs_road2",roadmap);},[roadmap]);

  const tok=auth?.tok;
  const clubId=profile?.club_id;

  // LOAD DATA
  const loadData=useCallback(async()=>{
    if(!clubId||!tok)return;
    setLoadingApp(true);
    try{
      const [pl,ma,tr,tn,ex]=await Promise.all([
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

  const usedInLines=new Set(lines.flatMap(l=>Object.values(l.slots).filter(Boolean)));

  const assignSlot=(li,pos,val)=>{
    if(pos==="__swap__"){
      const{from,to}=val;
      setLines(ls2=>ls2.map((l,i)=>{
        if(i!==li)return l;
        const s={...l.slots};
        [s[from],s[to]]=[s[to],s[from]];
        return{...l,slots:s};
      }));
    } else {
      setLines(ls2=>ls2.map((l,i)=>{
        if(i!==li)return l;
        const s={...l.slots};
        Object.keys(s).forEach(k=>{if(s[k]===val)s[k]=null;});
        s[pos]=val;
        return{...l,slots:s};
      }));
    }
  };
  const removeSlot=(li,pos)=>setLines(ls2=>ls2.map((l,i)=>i===li?{...l,slots:{...l.slots,[pos]:null}}:l));
  const renameLine=(li,name)=>setLines(ls2=>ls2.map((l,i)=>i===li?{...l,name}:l));
  const deleteLine=li=>setLines(ls2=>ls2.filter((_,i)=>i!==li));

  const toggleSelected=id=>setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});

  const startMatch=()=>{
    if(!opponent.trim()||selected.size===0)return;
    const m={id:Date.now(),date:matchDate,opponent:opponent.trim(),serie,players:[...selected],goalkeeper,note:""};
    setActiveMatch(m);setMatchStep("live");
  };

  const endMatch=async()=>{
    if(!activeMatch||!clubId)return;
    const entry={club_id:clubId,date:activeMatch.date,opponent:activeMatch.opponent,serie:activeMatch.serie,result:matchResult,scorers:matchScorers,players:activeMatch.players,goalkeeper:activeMatch.goalkeeper,note:activeMatch.note||"",created_by:auth.uid};
    const saved=await sbPost("matches",entry,tok);
    const sm=Array.isArray(saved)&&saved[0]?saved[0]:{...entry,id:Date.now()};
    setHistory(p=>[sm,...p]);
    const playedIds=[...activeMatch.players,...activeMatch.goalkeeper];
    for(const pid of playedIds){
      const pl=players.find(x=>x.id===pid);
      if(pl){const nm=(pl.matches||0)+1;await sbPatch("players",pid,{matches:nm,last_played:activeMatch.date},tok);setPlayers(p=>p.map(x=>x.id===pid?{...x,matches:nm,last_played:activeMatch.date}:x));}
    }
    setActiveMatch(null);setMatchResult({us:"",them:""});setMatchScorers([]);
    setSelected(new Set());setOpponent("");setGoalkeeper([]);setLines([mkLine(1),mkLine(2),mkLine(3)]);setReserves([]);
    setMatchStep("select");
  };

  const abortMatch=()=>{
    setActiveMatch(null);setMatchResult({us:"",them:""});setMatchScorers([]);
    setSelected(new Set());setOpponent("");setGoalkeeper([]);setLines([mkLine(1),mkLine(2),mkLine(3)]);setReserves([]);
    setMatchStep("select");setConfirmAbort(false);
  };

  // SEASON STATS
  const seasonStats=()=>{
    const pm={};
    history.forEach(m=>{
      (m.scorers||[]).forEach(s=>{
        const name=typeof s==="object"?s.name:s;
        const type=typeof s==="object"?s.type:"goal";
        if(!pm[name])pm[name]={name,goals:0,assists:0};
        if(type==="goal")pm[name].goals++;
        else pm[name].assists++;
      });
    });
    return Object.values(pm).map(p=>({...p,points:p.goals+p.assists})).sort((a,b)=>b.points-a.points||b.goals-a.goals);
  };
  const stats=seasonStats();
  const totalGoals=stats.reduce((s,p)=>s+p.goals,0);
  const totalAssists=stats.reduce((s,p)=>s+p.assists,0);

  const latestMatch=history[0]||null;

  // _HomeContent — extraherad till src/components/home/HomeContent.jsx
  // _MatchContent — extraherad till src/components/match/MatchContent.jsx (Sprint 2)

  // ── MER CONTENT
  const _MerContent=()=>(
    <div>
      {pendingCoaches.length>0&&!merSub&&(
        <div style={{background:"rgba(251,191,36,0.06)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
          <div style={{fontSize:10,color:"#fbbf24",fontWeight:700,marginBottom:10}}>VÄNTANDE TRÄNARE</div>
          {pendingCoaches.map(pc=>(
            <div key={pc.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:13,color:"#fff",fontWeight:700}}>{pc.username}</span>
              <button onClick={async()=>{await sbPatch("profiles",pc.id,{approved:true},tok);setPendingCoaches(p=>p.filter(x=>x.id!==pc.id));}} style={{padding:"6px 14px",border:"none",borderRadius:99,background:"#22c55e",color:"#0b0d14",fontSize:11,fontWeight:800,fontFamily:"inherit",cursor:"pointer"}}>Godkänn</button>
            </div>
          ))}
        </div>
      )}
      {!merSub&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[["spelare","👥","Spelarlista"],["lagmal","🎯","Lagmål och checklist"],["matchhistorik","📊","Matchhistorik"],["sasongsplan","🗓","Säsongsplan"]].map(([id,icon,label])=>(
            <button key={id} onClick={()=>setMerSub(id)} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
              <span style={{fontSize:22}}>{icon}</span>
              <span style={{fontSize:14,fontWeight:700,color:"#fff"}}>{label}</span>
              <span style={{marginLeft:"auto",color:"#4a5568",fontSize:16}}>›</span>
            </button>
          ))}
        </div>
      )}

      {merSub==="spelare"&&(
        <div>
          <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:2}}>
            {["ALL",...GROUPS,"MV"].map(g=><button key={g} onClick={()=>setFilterGroup(g)} style={{padding:"5px 12px",border:"1px solid "+(filterGroup===g?(g==="ALL"?"#22c55e":gc(g).color):"rgba(255,255,255,0.07)"),borderRadius:99,background:filterGroup===g?(g==="ALL"?"rgba(34,197,94,0.12)":gc(g).bg):"transparent",color:filterGroup===g?(g==="ALL"?"#22c55e":gc(g).color):"#4a5568",fontSize:11,fontWeight:700,fontFamily:"inherit",cursor:"pointer",whiteSpace:"nowrap"}}>{g==="ALL"?"Alla":"Gr."+g}</button>)}
          </div>
          {players.filter(p=>filterGroup==="ALL"||p.group===filterGroup).map(p=>{
            const pgc=gc(p.group);
            return(
              <div key={p.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:p.note||p.goals?.length?8:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:pgc.bg,border:"1.5px solid "+pgc.color,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:11,fontWeight:900,color:pgc.color}}>{p.name.slice(0,2).toUpperCase()}</span>
                    </div>
                    <div>
                      <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{p.name}</div>
                      <div style={{fontSize:10,color:pgc.color,marginTop:1}}>Grupp {p.group} - {p.matches||0} matcher</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>setNoteModal(p)} style={{padding:"6px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,color:"#94a3b8",fontSize:11,fontFamily:"inherit",cursor:"pointer"}}>✏ Notera</button>
                    <button onClick={()=>setGoalModal(p)} style={{padding:"6px 10px",background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:8,color:"#a78bfa",fontSize:11,fontFamily:"inherit",cursor:"pointer"}}>🎯 Mål</button>
                  </div>
                </div>
                {p.note&&<div style={{fontSize:12,color:p.note.startsWith("⚠")?"#fca5a5":"#64748b",background:p.note.startsWith("⚠")?"rgba(248,113,113,0.06)":"rgba(255,255,255,0.02)",borderRadius:8,padding:"6px 10px"}}>{p.note}</div>}
              </div>
            );
          })}
        </div>
      )}

      {merSub==="lagmal"&&(
        <div>
          {checklist.map((cat,ci)=>(
            <div key={ci} style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+cat.color+"25",borderRadius:16,padding:"14px 16px",marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:800,color:cat.color,marginBottom:12}}>{cat.category.toUpperCase()}</div>
              {cat.items.map(item=>(
                <div key={item.id} onClick={()=>setChecklist(c=>c.map((cc,i)=>i===ci?{...cc,items:cc.items.map(x=>x.id===item.id?{...x,done:!x.done}:x)}:cc))} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer"}}>
                  <div style={{width:18,height:18,borderRadius:5,border:"1.5px solid "+(item.done?cat.color:"rgba(255,255,255,0.15)"),background:item.done?cat.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                    {item.done&&<span style={{fontSize:10,color:"#0b0d14",fontWeight:900}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:item.done?"#4a5568":"#cbd5e1",lineHeight:1.4,textDecoration:item.done?"line-through":"none"}}>{item.text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {merSub==="matchhistorik"&&(
        <div>
          {history.length===0&&<div style={{textAlign:"center",padding:"48px 0",color:"#334155",fontSize:14}}>Inga matcher sparade ännu.</div>}
          {history.map(m=>(
            <MatchCard key={m.id} match={m}
              onEditNote={match=>setMatchNoteModal(match)}
              onDelete={async id=>{await sbDel("matches",id,tok);setHistory(p=>p.filter(x=>x.id!==id));}}
            />
          ))}
        </div>
      )}

      {merSub==="sasongsplan"&&(
        <div>
          {roadmap.map((period,pi)=>{
            const done=period.tasks.filter(t=>t.done).length;
            const isOpen=openPeriod===pi;
            return(
              <div key={pi} style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+period.color+"25",borderRadius:16,overflow:"hidden",marginBottom:10}}>
                <div onClick={()=>setOpenPeriod(isOpen?null:pi)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",cursor:"pointer"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:13,fontWeight:800,color:period.color}}>{period.label}</span>
                      <span style={{fontSize:11,color:"#4a5568"}}>{period.period}</span>
                    </div>
                    <div style={{fontSize:11,color:"#4a5568",marginTop:3}}>{done}/{period.tasks.length} klara</div>
                  </div>
                  <span style={{color:"#4a5568"}}>{isOpen?"▲":"▼"}</span>
                </div>
                {isOpen&&period.tasks.map(task=>(
                  <div key={task.id} onClick={()=>setRoadmap(r=>r.map((pp,i)=>i===pi?{...pp,tasks:pp.tasks.map(t=>t.id===task.id?{...t,done:!t.done}:t)}:pp))} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderTop:"1px solid rgba(255,255,255,0.04)",cursor:"pointer"}}>
                    <div style={{width:18,height:18,borderRadius:5,border:"1.5px solid "+(task.done?period.color:"rgba(255,255,255,0.15)"),background:task.done?period.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {task.done&&<span style={{fontSize:10,color:"#0b0d14",fontWeight:900}}>✓</span>}
                    </div>
                    <span style={{fontSize:13,color:task.done?"#4a5568":"#cbd5e1",textDecoration:task.done?"line-through":"none"}}>{task.text}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"#0b0d14",fontFamily:"system-ui,sans-serif",color:"#fff",paddingBottom:72}}>
      {noteModal&&<NoteModal player={noteModal} onClose={()=>setNoteModal(null)} onSave={async text=>{await updP(noteModal.id,{note:text});setNoteModal(null);}}/>}
      {goalModal&&<GoalModal player={goalModal} onClose={()=>setGoalModal(null)} onSave={async goals=>{await updP(goalModal.id,{goals});setGoalModal(null);}}/>}
      {matchNoteModal&&(
        <div onClick={()=>setMatchNoteModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#161926",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"20px 20px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:430}}>
            <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:14}}>Notering - vs {matchNoteModal.opponent}</div>
            <textarea defaultValue={matchNoteModal.note||""} id="match-note-area" placeholder="T.ex. bra press, jobbig domare..." style={{width:"100%",minHeight:80,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",fontSize:14,padding:12,fontFamily:"inherit",resize:"none",outline:"none",boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:10,marginTop:12}}>
              <button onClick={()=>setMatchNoteModal(null)} style={{flex:1,padding:"12px 0",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,background:"transparent",color:"#4a5568",fontSize:14,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Avbryt</button>
              <button onClick={async()=>{const txt=document.getElementById("match-note-area").value;await sbPatch("matches",matchNoteModal.id,{note:txt},tok);setHistory(p=>p.map(m=>m.id===matchNoteModal.id?{...m,note:txt}:m));setMatchNoteModal(null);}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:12,background:"#a78bfa",color:"#fff",fontSize:14,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Spara</button>
            </div>
          </div>
        </div>
      )}

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
        {tab==="home"&&<HomeContent injured={injured} nextMatch={nextMatch} setNextMatch={setNextMatch} latestMatch={latestMatch} stats={stats} totalGoals={totalGoals} totalAssists={totalAssists} history={history} players={players} trainNoteInput={trainNoteInput} setTrainNoteInput={setTrainNoteInput} trainNotes={trainNotes} setTrainNotes={setTrainNotes} clubId={clubId} uid={auth.uid} tok={tok}/>}
        {tab==="traning"&&trainSub==="kedjor"&&<KedjorTab players={players} onUpdatePlayerGroup={async(id,group)=>{setPlayers(p=>p.map(x=>x.id===id?{...x,group}:x));await sbPatch("players",id,{group},tok);}}/>}
        {tab==="traning"&&trainSub==="planera"&&<PlaneraTab exercises={exercises} trainHistory={trainHistory}
          onSave={async entry=>{const row={club_id:clubId,date:entry.date,exercises:entry.exercises,total_minutes:entry.totalMinutes,note:entry.note||"",created_by:auth.uid};const saved=await sbPost("training_sessions",row,tok);const s=Array.isArray(saved)&&saved[0]?saved[0]:{...row,id:Date.now()};setTrainHistory(p=>[s,...p]);}}
          onDelete={async id=>{await sbDel("training_sessions",id,tok);setTrainHistory(p=>p.filter(x=>x.id!==id));}}
        />}
        {tab==="traning"&&trainSub==="ovningar"&&<OvningarTab token={tok}/>}
        {tab==="match"&&<MatchContent activeMatch={activeMatch} matchStep={matchStep} setMatchStep={setMatchStep} matchResult={matchResult} setMatchResult={setMatchResult} matchScorers={matchScorers} setMatchScorers={setMatchScorers} confirmAbort={confirmAbort} setConfirmAbort={setConfirmAbort} lines={lines} setLines={setLines} players={players} selected={selected} setSelected={setSelected} matchDate={matchDate} setMatchDate={setMatchDate} opponent={opponent} setOpponent={setOpponent} serie={serie} setSerie={setSerie} goalkeeper={goalkeeper} setGoalkeeper={setGoalkeeper} usedInLines={usedInLines} gkPlayers={gkPlayers} field={field} startMatch={startMatch} endMatch={endMatch} abortMatch={abortMatch} assignSlot={assignSlot} removeSlot={removeSlot} renameLine={renameLine} deleteLine={deleteLine} toggleSelected={toggleSelected}/>}
        {tab==="mer"&&_MerContent()}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(11,13,20,0.97)",backdropFilter:"blur(12px)",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",zIndex:100}}>
        {[{id:"home",icon:"🏠",label:"Hem"},{id:"traning",icon:"🏋",label:"Träning"},{id:"match",icon:"⚡",label:"Match"},{id:"mer",icon:"☰",label:"Mer"}].map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);if(t.id!=="mer")setMerSub(null);}} style={{flex:1,padding:"10px 0 14px",border:"none",background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",color:tab===t.id?"#22c55e":"#4a5568",fontFamily:"inherit"}}>
            <span style={{fontSize:20}}>{t.icon}</span>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.04em"}}>{t.label.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
