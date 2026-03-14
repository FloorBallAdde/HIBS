import StableInput from "../ui/StableInput.jsx";
import { SERIES, FMT, GC, gc, TODAY } from "../../lib/constants.js";
import { sbPost, sbDel } from "../../lib/supabase.js";
import { useState } from "react";

// Hemfliken — dashboard med skadade, form, kommande matcher, senaste match, träning, säsongsstatistik
export default function HomeContent({
  injured, upcomingMatches, addUpcoming, removeUpcoming, latestMatch,
  stats, totalGoals, totalAssists, history, players,
  trainHistory,
  trainNoteInput, setTrainNoteInput, trainNotes, setTrainNotes,
  clubId, uid, tok,
}){
  // State för "lägg till kommande match"-formuläret
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOpp, setNewOpp] = useState("");
  const [newDate, setNewDate] = useState(TODAY());
  const [newSerie, setNewSerie] = useState("14A");

  const handleAddMatch = () => {
    if (!newOpp.trim() || !newDate) return;
    addUpcoming({ opponent: newOpp.trim(), date: newDate, serie: newSerie });
    setNewOpp(""); setNewDate(TODAY()); setNewSerie("14A");
    setShowAddForm(false);
  };
  // Hjälpfunktion: spara ny träningsnotis
  const addNote=()=>{
    if(!trainNoteInput.trim())return;
    const txt=trainNoteInput.trim();
    sbPost("training_notes",{club_id:clubId,text:txt,created_by:uid},tok).then(r=>{
      const s=Array.isArray(r)&&r[0]?r[0]:{id:Date.now(),text:txt};
      setTrainNotes(n=>[s,...n]);
    });
    setTrainNoteInput("");
  };

  // Beräkna form (V/O/F) per match
  const formResult=(m)=>{
    const us=parseInt(m.result?.us);
    const them=parseInt(m.result?.them);
    if(isNaN(us)||isNaN(them)||m.result?.us===""||m.result?.them==="")return null;
    if(us>them)return"V";
    if(us<them)return"F";
    return"O";
  };
  const formColor=(res)=>res==="V"?"#22c55e":res==="F"?"#f87171":res==="O"?"#fbbf24":"#4a5568";

  // Senaste träning
  const lastTrain=trainHistory&&trainHistory.length>0?trainHistory[0]:null;

  return(
    <div>
      {/* SKADADE */}
      {injured.length>0&&(
        <div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:14,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:800,color:"#f87171",marginBottom:6}}>SKADADE SPELARE</div>
          {injured.map(p=><div key={p.id} style={{fontSize:13,color:"#fca5a5",marginBottom:2}}>{p.name} - {p.note.slice(1).trim()}</div>)}
        </div>
      )}

      {/* LAGETS FORM — sista 5 matcherna */}
      {history.length>0&&(()=>{
        const recent=history.slice(0,5);
        const withRes=history.filter(m=>formResult(m)!==null);
        const wins=withRes.filter(m=>formResult(m)==="V").length;
        const rate=withRes.length>0?Math.round(wins/withRes.length*100):0;
        return(
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"16px 18px",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:10,color:"#4a5568",fontWeight:700}}>LAGETS FORM</div>
              <div style={{fontSize:11,color:"#4a5568"}}>{wins} V / {withRes.length} mat ({rate}%)</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              {recent.map((m,i)=>{
                const res=formResult(m);
                const col=formColor(res);
                return(
                  <div key={m.id||i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1}}>
                    <div style={{width:"100%",maxWidth:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.03)",border:"2px "+(res?"solid":"dashed")+" "+col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:res?14:11,fontWeight:900,color:col,margin:"0 auto"}}>
                      {res||"–"}
                    </div>
                    <div style={{fontSize:9,color:"#4a5568",textAlign:"center",lineHeight:1.2,wordBreak:"break-all"}}>{m.opponent?.slice(0,7)}</div>
                    {m.result?.us!==""&&m.result?.them!==""&&(
                      <div style={{fontSize:9,color:"#334155",textAlign:"center"}}>{m.result.us}-{m.result.them}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* KOMMANDE MATCHER */}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"16px 18px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:10,color:"#4a5568",fontWeight:700}}>KOMMANDE MATCHER</div>
          <button onClick={()=>setShowAddForm(f=>!f)} style={{padding:"4px 12px",border:"1px solid rgba(34,197,94,0.3)",borderRadius:99,background:"rgba(34,197,94,0.08)",color:"#22c55e",fontSize:11,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>{showAddForm?"Avbryt":"+ Lägg till"}</button>
        </div>

        {/* Formulär: lägg till match */}
        {showAddForm&&(
          <div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:"12px",marginBottom:12}}>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <StableInput value={newOpp} onChange={e=>setNewOpp(e.target.value)} placeholder="Motståndare" style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#fff",fontSize:13,padding:"8px 12px",fontFamily:"inherit",outline:"none"}}/>
              <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={{width:120,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#fff",fontSize:13,padding:"8px 10px",fontFamily:"inherit",outline:"none",colorScheme:"dark"}}/>
            </div>
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              {SERIES.map(s=><button key={s} onClick={()=>setNewSerie(s)} style={{flex:1,padding:"7px 0",border:"1px solid "+(newSerie===s?"#f472b6":"rgba(255,255,255,0.07)"),borderRadius:8,background:newSerie===s?"rgba(244,114,182,0.1)":"transparent",color:newSerie===s?"#f472b6":"#4a5568",fontSize:11,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>{s}</button>)}
            </div>
            <button onClick={handleAddMatch} style={{width:"100%",padding:"10px 0",border:"none",borderRadius:10,background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",fontSize:13,fontWeight:800,fontFamily:"inherit",cursor:"pointer"}}>Lägg till match</button>
          </div>
        )}

        {/* Lista kommande matcher */}
        {upcomingMatches.length===0&&!showAddForm&&(
          <div style={{fontSize:12,color:"#334155",textAlign:"center",padding:"8px 0"}}>Inga planerade matcher</div>
        )}
        {upcomingMatches.map(m=>{
          const sc=m.serie==="14A"?"#f472b6":m.serie==="15A"?"#38bdf8":"#fbbf24";
          const d=Math.ceil((new Date(m.date)-new Date())/(1000*60*60*24));
          return(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                  <span style={{fontSize:11,fontWeight:800,color:sc,background:sc+"18",border:"1px solid "+sc+"40",borderRadius:99,padding:"1px 7px"}}>{m.serie}</span>
                  <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>vs {m.opponent}</span>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <span style={{fontSize:11,color:"#4a5568"}}>{FMT(m.date)}</span>
                  {d===0?<span style={{fontSize:11,color:"#22c55e",fontWeight:700}}>Idag!</span>:d>0?<span style={{fontSize:11,color:"#4a5568"}}>om {d} d</span>:null}
                </div>
              </div>
              <button onClick={()=>removeUpcoming(m.id)} style={{background:"none",border:"none",color:"#334155",cursor:"pointer",fontSize:17,padding:4,lineHeight:1}}>×</button>
            </div>
          );
        })}
      </div>

      {/* SENASTE MATCH */}
      {latestMatch&&(
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"16px 18px",marginBottom:16}}>
          <div style={{fontSize:10,color:"#4a5568",fontWeight:700,marginBottom:10}}>SENASTE MATCH</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <span style={{fontSize:13,fontWeight:800,color:"#fff"}}>vs {latestMatch.opponent}</span>
            {latestMatch.result&&<span style={{fontSize:14,fontWeight:900,color:"#22c55e",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:8,padding:"2px 10px"}}>{latestMatch.result.us}-{latestMatch.result.them}</span>}
          </div>
          <div style={{fontSize:11,color:"#4a5568",marginBottom:8}}>{FMT(latestMatch.date)}</div>
          {(latestMatch.scorers||[]).filter(s=>typeof s==="object"?s.type==="goal":true).length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {(latestMatch.scorers||[]).filter(s=>typeof s==="object"?s.type==="goal":true).map((s,i)=>(
                <span key={i} style={{fontSize:12,color:"#fbbf24",background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:99,padding:"3px 10px"}}>{typeof s==="object"?s.name:s}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SENASTE TRÄNING */}
      {lastTrain&&(
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"16px 18px",marginBottom:16}}>
          <div style={{fontSize:10,color:"#4a5568",fontWeight:700,marginBottom:8}}>SENASTE TRÄNING</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:lastTrain.exercises?.length>0?8:0}}>
            <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{FMT(lastTrain.date)}</div>
            {lastTrain.total_minutes>0&&(
              <div style={{fontSize:12,color:"#a78bfa",background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:99,padding:"2px 10px"}}>{lastTrain.total_minutes} min</div>
            )}
          </div>
          {lastTrain.exercises&&lastTrain.exercises.length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {lastTrain.exercises.slice(0,4).map((ex,i)=>{
                const name=typeof ex==="object"?ex.name:ex;
                return<span key={i} style={{fontSize:11,color:"#38bdf8",background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:99,padding:"2px 8px"}}>{name}</span>;
              })}
              {lastTrain.exercises.length>4&&(
                <span style={{fontSize:11,color:"#4a5568",padding:"2px 4px"}}>+{lastTrain.exercises.length-4} till</span>
              )}
            </div>
          )}
          {lastTrain.note&&<div style={{fontSize:11,color:"#64748b",marginTop:6,fontStyle:"italic"}}>{lastTrain.note}</div>}
        </div>
      )}

      {/* SÄSONGSSTATISTIK */}
      {stats.length>0&&(
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"16px 18px",marginBottom:16}}>
          <div style={{fontSize:10,color:"#4a5568",fontWeight:700,marginBottom:10}}>SÄSONGSSTATISTIK</div>
          <div style={{display:"flex",gap:16,marginBottom:14}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:"#22c55e"}}>{history.length}</div><div style={{fontSize:10,color:"#4a5568"}}>matcher</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:"#fbbf24"}}>{totalGoals}</div><div style={{fontSize:10,color:"#4a5568"}}>mål</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:"#38bdf8"}}>{totalAssists}</div><div style={{fontSize:10,color:"#4a5568"}}>assist</div></div>
          </div>
          {stats.slice(0,5).map((p,i)=>{
            const player=players.find(x=>x.name===p.name);
            const pgc=player?gc(player.group):GC._;
            const maxPts=stats[0]?.points||1;
            return(
              <div key={p.name} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{fontSize:12,color:i<3?"#fbbf24":"#4a5568",fontWeight:700,width:18,textAlign:"right"}}>{i+1}</span>
                <div style={{width:8,height:8,borderRadius:"50%",background:pgc.color,flexShrink:0}}/>
                <span style={{fontSize:13,color:"#fff",fontWeight:700,flex:1}}>{p.name}</span>
                <span style={{fontSize:11,color:"#fbbf24"}}>{p.goals}M</span>
                <span style={{fontSize:11,color:"#38bdf8"}}>{p.assists}A</span>
                <span style={{fontSize:11,color:"#22c55e",fontWeight:700,width:20,textAlign:"right"}}>{p.points}P</span>
                <div style={{width:48,height:4,background:"rgba(255,255,255,0.05)",borderRadius:99,overflow:"hidden",flexShrink:0}}>
                  <div style={{height:"100%",width:(p.points/maxPts*100)+"%",background:pgc.color,borderRadius:99}}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TRÄNINGSNOTISER */}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"16px 18px",marginBottom:16}}>
        <div style={{fontSize:10,color:"#4a5568",fontWeight:700,marginBottom:10}}>TRÄNINGSNOTISER</div>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <StableInput value={trainNoteInput} onChange={e=>setTrainNoteInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addNote();}} placeholder="Något att ta upp på träning..." style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#fff",fontSize:13,padding:"9px 12px",fontFamily:"inherit",outline:"none"}}/>
          <button onClick={addNote} style={{padding:"9px 14px",background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:10,color:"#22c55e",fontSize:18,fontFamily:"inherit",cursor:"pointer",fontWeight:300}}>+</button>
        </div>
        {trainNotes.map(n=>(
          <div key={n.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 12px",background:"rgba(255,255,255,0.02)",borderRadius:10,marginBottom:6}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",marginTop:5,flexShrink:0}}/>
            <span style={{fontSize:13,color:"#cbd5e1",flex:1,lineHeight:1.5}}>{n.text}</span>
            <button onClick={()=>{sbDel("training_notes",n.id,tok);setTrainNotes(p=>p.filter(x=>x.id!==n.id));}} style={{background:"none",border:"none",color:"#334155",cursor:"pointer",fontSize:16,padding:0,flexShrink:0,lineHeight:1}}>×</button>
          </div>
        ))}
        {trainNotes.length===0&&<div style={{fontSize:12,color:"#334155",textAlign:"center",padding:"8px 0"}}>Inga notiser</div>}
      </div>
    </div>
  );
}
