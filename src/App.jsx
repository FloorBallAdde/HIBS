import { useState, useRef, useEffect, useCallback, useMemo } from "react";


// Fristående input som inte tappar fokus vid re-render
function StableInput({value, onChange, onKeyDown, placeholder, style, type}){
  const [local, setLocal] = useState(value);
  const ref = useRef(value);
  // Sync if parent value changes from outside (not from typing)
  useEffect(()=>{
    if(value !== ref.current) { setLocal(value); ref.current = value; }
  }, [value]);
  return (
    <input
      type={type||"text"}
      value={local}
      placeholder={placeholder}
      style={style}
      onKeyDown={onKeyDown}
      onChange={e=>{
        const v = e.target.value;
        setLocal(v);
        ref.current = v;
        onChange(e);
      }}
    />
  );
}

// SUPABASE
const SB_URL = "https://gulezkehu wmmdipmn zqv.supabase.co".replace(/ /g,"");
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1bGV6a2VodXdtbWRpcG1uenF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODcxMDYsImV4cCI6MjA4ODU2MzEwNn0.ecMLLoVAer1R-lCQG1V4OyCI7U2lu0ZdUmqwcIsV_24";
function hdrs(tok){return{apikey:SB_KEY,Authorization:"Bearer "+(tok||SB_KEY),"Content-Type":"application/json",Prefer:"return=representation"};}
async function sbAuth(path,body){const r=await fetch(SB_URL+"/auth/v1/"+path,{method:"POST",headers:hdrs(),body:JSON.stringify(body)});return r.json();}
async function sbGet(table,query,tok){const r=await fetch(SB_URL+"/rest/v1/"+table+"?"+(query||"order=created_at.desc"),{headers:hdrs(tok)});return r.json();}
async function sbPost(table,body,tok){const r=await fetch(SB_URL+"/rest/v1/"+table,{method:"POST",headers:hdrs(tok),body:JSON.stringify(body)});return r.json();}
async function sbPatch(table,id,body,tok){const r=await fetch(SB_URL+"/rest/v1/"+table+"?id=eq."+id,{method:"PATCH",headers:hdrs(tok),body:JSON.stringify(body)});return r.json();}
async function sbDel(table,id,tok){await fetch(SB_URL+"/rest/v1/"+table+"?id=eq."+id,{method:"DELETE",headers:hdrs(tok)});}

// LOCAL STORAGE
const ls={
  get:(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
  clear:()=>{try{localStorage.clear();}catch{}},
};

// HELPERS
const TODAY=()=>new Date().toISOString().slice(0,10);
const FMT=d=>d?new Date(d).toLocaleDateString("sv-SE",{day:"numeric",month:"short"}):"-";
const mkLine=id=>({id,name:"Linje "+id,slots:{forward:null,vanster:null,hoger:null,back:null}});
const shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

// CONSTANTS
const GC={
  A:{color:"#a78bfa",bg:"rgba(167,139,250,0.12)",border:"rgba(167,139,250,0.3)"},
  B:{color:"#38bdf8",bg:"rgba(56,189,248,0.12)",border:"rgba(56,189,248,0.3)"},
  C:{color:"#f472b6",bg:"rgba(244,114,182,0.12)",border:"rgba(244,114,182,0.3)"},
  D:{color:"#34d399",bg:"rgba(52,211,153,0.12)",border:"rgba(52,211,153,0.3)"},
  E:{color:"#fbbf24",bg:"rgba(251,191,36,0.12)",border:"rgba(251,191,36,0.3)"},
  MV:{color:"#fb923c",bg:"rgba(251,146,60,0.12)",border:"rgba(251,146,60,0.3)"},
  _:{color:"#64748b",bg:"rgba(100,116,139,0.12)",border:"rgba(100,116,139,0.3)"},
};
const gc=g=>GC[g]||GC._;
const PCOLOR={forward:"#f472b6",vanster:"#38bdf8",hoger:"#34d399",back:"#a78bfa"};
const PLABEL={forward:"FWD",vanster:"VA",hoger:"HO",back:"BCK"};
const SERIES=["14A","15A","Cupmatch","Traningsmatch"];
const GROUPS=["A","B","C","D","E"];
const CAT_COLOR={"Spelövning":"#38bdf8","Anfallsövning":"#f472b6","Försvarsövning":"#a78bfa","Teknikövning":"#fbbf24","Färdighetsövning":"#fb923c","Rolig övning":"#34d399"};
const CATEGORIES=["Alla","Spelövning","Anfallsövning","Försvarsövning","Teknikövning","Färdighetsövning","Rolig övning"];
const INTENSITIES=["Alla","Låg","Medel","Hög"];
const CHAIN_POS=["1:a","V2:a","H2:a","3:a"];
const CHAIN_COL={"1:a":"#f472b6","V2:a":"#38bdf8","H2:a":"#34d399","3:a":"#a78bfa"};
const DEFAULT_PLAYERS=[
  {name:"Joel",group:"A"},{name:"Oliver",group:"A"},{name:"Rasmus",group:"A"},{name:"Lucas",group:"A"},
  {name:"William",group:"B"},{name:"Mille",group:"B"},{name:"Marcus",group:"B"},{name:"Charlie M",group:"B"},
  {name:"Lo",group:"C"},{name:"Ludde M",group:"C"},{name:"Jacob",group:"C"},{name:"Linus",group:"C"},
  {name:"Hugo T",group:"D"},{name:"Freke",group:"D"},{name:"Viktor",group:"D"},{name:"Charlie E",group:"D"},
  {name:"Jonas",group:"E"},{name:"Arvid",group:"E"},{name:"Sigge",group:"E"},{name:"Benji",group:"E"},
  {name:"Loke",group:"MV",role:"malvakt"},{name:"Otto",group:"MV",role:"malvakt"},
];
const CHECKLIST_INIT=[
  {category:"Mental styrka",color:"#a78bfa",items:[
    {id:"c1",text:"Vi har pratat om guldfisk-principen med spelarna",done:false},
    {id:"c2",text:"Spelarna har en reset-rutin vid motgang",done:false},
    {id:"c3",text:"Vi anvander delmal utover resultat vid match",done:false},
    {id:"c4",text:"Laget vet vad nasta aktion betyder",done:false},
  ]},
  {category:"Spelfilosofi",color:"#38bdf8",items:[
    {id:"c5",text:"Speliden ar nedskriven och kommunicerad",done:false},
    {id:"c6",text:"Spelarna kan forklara vinn boll ga",done:false},
    {id:"c7",text:"Vi tranar gapet mellan 2 spelare aktivt",done:false},
    {id:"c8",text:"Lopningar bakom ryggar i minst 2 ovningar per traning",done:false},
    {id:"c9",text:"Malvakten har en tydlig roll i uppspelet",done:false},
  ]},
  {category:"Lagkultur",color:"#f472b6",items:[
    {id:"c10",text:"Lagkontrakt skrivet med spelarna",done:false},
    {id:"c11",text:"Foraldramote genomfort infor sasongen",done:false},
    {id:"c12",text:"Foraldrartranig bokad eller genomford",done:false},
    {id:"c13",text:"Konsekvenssystemet tydligt for alla spelare",done:false},
  ]},
  {category:"Fysik",color:"#34d399",items:[
    {id:"c14",text:"Knakontroll del av varje uppvarmning",done:false},
    {id:"c15",text:"Stretch inbyggt i traningsrutinen",done:false},
    {id:"c16",text:"Spelarna vet varfor de gor knaovningarna",done:false},
  ]},
  {category:"Verktyg",color:"#fbbf24",items:[
    {id:"c17",text:"Padlet uppsatt och delat med tranarlaget",done:false},
    {id:"c18",text:"Vi foljer relevanta Instagram-konton",done:false},
    {id:"c19",text:"Individuella mal dokumenterade",done:false},
  ]},
];
const ROADMAP_INIT=[
  {period:"Nu - Feb",label:"Forberedelse",color:"#a78bfa",bg:"rgba(167,139,250,0.08)",tasks:[
    {id:"r1",text:"Satt upp Padlet for laget",done:false},
    {id:"r2",text:"Folj relevanta Instagram-konton",done:false},
    {id:"r3",text:"Skriv ner er spelide",done:false},
    {id:"r4",text:"Bestam speluppstallning 1-2-1",done:false},
    {id:"r5",text:"Skapa lagkontrakt med spelarna",done:false},
    {id:"r6",text:"Planera foraldramote",done:false},
  ]},
  {period:"Feb - Mar",label:"Traningsstart",color:"#38bdf8",bg:"rgba(56,189,248,0.08)",tasks:[
    {id:"r7",text:"Introducera knakontroll i varje uppvarmning",done:false},
    {id:"r8",text:"Kor foraldrartranig",done:false},
    {id:"r9",text:"Borja med individuella mal",done:false},
    {id:"r10",text:"Trana reset-rutin",done:false},
    {id:"r11",text:"Bygg in positionsbyte i varje traning",done:false},
    {id:"r12",text:"Introducera delmalspoang",done:false},
  ]},
  {period:"Mar - Apr",label:"Seriestart",color:"#f472b6",bg:"rgba(244,114,182,0.08)",tasks:[
    {id:"r13",text:"Satt prestationsmal vid match",done:false},
    {id:"r14",text:"Bestam matchregel bara fragor fran banken",done:false},
    {id:"r15",text:"Genomgang vad ar guldfisk-tanket",done:false},
    {id:"r16",text:"Malvakterna specifikt ansvar i spelet",done:false},
    {id:"r17",text:"Utvardera lagkulturen efter 3 matcher",done:false},
  ]},
  {period:"Lopande",label:"Hela sasongen",color:"#34d399",bg:"rgba(52,211,153,0.08)",tasks:[
    {id:"r18",text:"Lar kanna spelarna",done:false},
    {id:"r19",text:"Avsluta varje traning positivt",done:false},
    {id:"r20",text:"Ge ratt beteende uppmarksamhet",done:false},
    {id:"r21",text:"Frukt tillganglig innan traning",done:false},
    {id:"r22",text:"Reflektera manadsvis om speliden",done:false},
  ]},
];

// AUTH SCREEN
function AuthScreen({onAuth}){
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [username,setUsername]=useState("");
  const [clubName,setClubName]=useState("");
  const [clubSearch,setClubSearch]=useState("");
  const [clubs,setClubs]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [authData,setAuthData]=useState(null); // {tok, uid} after login, before club chosen

  const err=msg=>{setError(msg);setLoading(false);};
  const inpStyle={width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,color:"#fff",fontSize:14,padding:"12px 14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:12};

  const doRegister=async()=>{
    if(!email||!password||!username)return err("Fyll i alla fält");
    if(password.length<6)return err("Minst 6 tecken i lösenordet");
    setLoading(true);setError("");
    const res=await sbAuth("signup",{email,password,data:{username}});
    if(res.error)return err(res.error.message||"Registrering misslyckades");
    setMode("check_email");
    setLoading(false);
  };

  const doLogin=async()=>{
    if(!email||!password)return err("Fyll i email och lösenord");
    setLoading(true);setError("");
    const res=await sbAuth("token?grant_type=password",{email,password});
    if(res.error)return err(res.error.message||"Fel email eller lösenord");
    const tok=res.access_token;const uid=res.user.id;
    const prof=await sbGet("profiles","id=eq."+uid+"&select=*",tok);
    const profile=Array.isArray(prof)&&prof[0]?prof[0]:null;
    if(!profile)return err("Profil: "+JSON.stringify(prof).slice(0,150));
    // no club yet - show club selection
    if(!profile.club_id){setAuthData({tok,uid,username:profile.username||username});setMode("choose_club");setLoading(false);return;}
    if(!profile.approved&&profile.role!=="owner"){setLoading(false);setMode("pending");return;}
    ls.set("hibs_token",tok);ls.set("hibs_uid",uid);
    onAuth({tok,uid,profile});
  };

  const doCreateClub=async()=>{
    if(!clubName.trim())return err("Ange klubbnamn");
    setLoading(true);setError("");
    try{
      const{tok,uid,username:uname}=authData;
      const cr=await sbPost("clubs",{name:clubName.trim(),owner_id:uid},tok);
      if(cr?.code||cr?.message&&!cr?.id)return err("Klubb fel: "+(cr.message||cr.code||JSON.stringify(cr)));
      const club=Array.isArray(cr)?cr[0]:cr;
      if(!club?.id)return err("Klubb skapades inte: "+JSON.stringify(cr));
      const pr=await sbPatch("profiles",uid,{username:uname,club_id:club.id,role:"owner",approved:true},tok);
      if(pr?.code)return err("Profil fel: "+(pr.message||pr.code));
      for(const p of DEFAULT_PLAYERS){
        await sbPost("players",{club_id:club.id,name:p.name,group:p.group,role:p.role||"utespelare",matches:0,note:"",goals:[]},tok);
      }
      const profile={id:uid,username:uname,club_id:club.id,role:"owner",approved:true,clubs:club};
      ls.set("hibs_token",tok);ls.set("hibs_uid",uid);
      onAuth({tok,uid,profile});
    }catch(e){err("Oväntat fel: "+e.message);}
  };

  const doJoinClub=async(club)=>{
    setLoading(true);setError("");
    const{tok,uid,username:uname}=authData;
    await sbPatch("profiles",uid,{username:uname,club_id:club.id,role:"coach",approved:false},tok);
    setLoading(false);setMode("pending");
  };

  const searchClubs=async()=>{
    if(!clubSearch.trim())return;
    const res=await sbGet("clubs","name=ilike.*"+encodeURIComponent(clubSearch.trim())+"*");
    setClubs(Array.isArray(res)?res:[]);
  };

  const Btn=({label,onClick})=>(
    <button onClick={onClick} disabled={loading}
      style={{width:"100%",padding:"14px 0",border:"none",borderRadius:14,background:loading?"rgba(255,255,255,0.06)":"#a78bfa",color:loading?"#4a5568":"#fff",fontSize:15,fontWeight:900,fontFamily:"inherit",cursor:loading?"not-allowed":"pointer",marginBottom:10}}>
      {loading?"Väntar...":label}
    </button>
  );

  return(
    <div style={{minHeight:"100vh",background:"#0b0d14",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:32,fontWeight:900,color:"#fff",letterSpacing:"-1px"}}>HIBS</div>
          <div style={{fontSize:12,color:"#4a5568",marginTop:4}}>Tränarapp P2015</div>
        </div>

        {mode==="check_email"&&(
          <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:16,padding:24,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:12}}>📧</div>
            <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:8}}>Kolla din mail!</div>
            <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.6,marginBottom:16}}>Vi har skickat en bekräftelselänk till <span style={{color:"#fff",fontWeight:700}}>{email}</span>. Klicka på länken och logga sedan in här.</div>
            <button onClick={()=>setMode("login")} style={{padding:"12px 24px",border:"none",borderRadius:12,background:"#a78bfa",color:"#fff",fontSize:14,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Gå till inloggning</button>
          </div>
        )}

        {mode==="pending"&&(
          <div style={{background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:16,padding:24,textAlign:"center"}}>
            <div style={{fontSize:26,marginBottom:12}}>⏳</div>
            <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:8}}>Väntar på godkännande</div>
            <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.6,marginBottom:16}}>Klubbägaren behöver godkänna dig.</div>
            <button onClick={()=>setMode("login")} style={{padding:"10px 24px",border:"1px solid rgba(255,255,255,0.1)",borderRadius:99,background:"transparent",color:"#4a5568",fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>Tillbaka</button>
          </div>
        )}

        {(mode==="login"||mode==="register")&&(
          <div>
            <div style={{display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:12,padding:4,marginBottom:24}}>
              {[["login","Logga in"],["register","Registrera"]].map(([m,l])=>(
                <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"10px 0",border:"none",borderRadius:9,background:mode===m?"rgba(255,255,255,0.08)":"transparent",color:mode===m?"#fff":"#4a5568",fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>{l}</button>
              ))}
            </div>
            {mode==="register"&&<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Användarnamn" type="text" style={inpStyle}/>}
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={inpStyle}/>
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Lösenord" type="password" style={inpStyle}/>
            {mode==="register"&&<div style={{fontSize:11,color:"#4a5568",marginBottom:12,lineHeight:1.5}}>Efter registrering skickas ett bekräftelsemail. Logga in när du bekräftat.</div>}
            {error&&<div style={{color:"#f87171",fontSize:12,marginBottom:12}}>{error}</div>}
            <Btn label={mode==="login"?"Logga in":"Skapa konto"} onClick={mode==="login"?doLogin:doRegister}/>
          </div>
        )}

        {mode==="choose_club"&&(
          <div>
            <div style={{fontSize:16,fontWeight:900,color:"#fff",marginBottom:4}}>Välj klubb</div>
            <div style={{fontSize:12,color:"#4a5568",marginBottom:20}}>Skapa ny eller gå med i befintlig.</div>
            <button onClick={()=>setMode("create_club")} style={{width:"100%",padding:"14px 0",border:"2px solid rgba(34,197,94,0.4)",borderRadius:14,background:"rgba(34,197,94,0.08)",color:"#22c55e",fontSize:14,fontWeight:800,fontFamily:"inherit",cursor:"pointer",marginBottom:10}}>+ Skapa ny klubb</button>
            <button onClick={()=>setMode("join_club")} style={{width:"100%",padding:"14px 0",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,background:"transparent",color:"#94a3b8",fontSize:14,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Gå med i befintlig klubb</button>
          </div>
        )}

        {mode==="create_club"&&(
          <div>
            <div style={{fontSize:16,fontWeight:900,color:"#fff",marginBottom:4}}>Skapa klubb</div>
            <div style={{fontSize:12,color:"#4a5568",marginBottom:20}}>Du blir ägare och kan bjuda in tränare.</div>
            <input value={clubName} onChange={e=>setClubName(e.target.value)} placeholder="Klubbnamn t.ex. HIBS P2015" type="text" style={inpStyle}/>
            {error&&<div style={{color:"#f87171",fontSize:12,marginBottom:12}}>{error}</div>}
            <Btn label="Skapa klubb" onClick={doCreateClub}/>
            <button onClick={()=>setMode("choose_club")} style={{width:"100%",padding:"10px 0",border:"none",background:"none",color:"#4a5568",fontSize:13,fontFamily:"inherit",cursor:"pointer"}}>Tillbaka</button>
          </div>
        )}

        {mode==="join_club"&&(
          <div>
            <div style={{fontSize:16,fontWeight:900,color:"#fff",marginBottom:4}}>Gå med i klubb</div>
            <div style={{fontSize:12,color:"#4a5568",marginBottom:16}}>Sök på klubbnamn.</div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <input value={clubSearch} onChange={e=>setClubSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchClubs()} placeholder="Sök klubb..." style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,color:"#fff",fontSize:14,padding:"12px 14px",fontFamily:"inherit",outline:"none"}}/>
              <button onClick={searchClubs} style={{padding:"12px 16px",background:"rgba(56,189,248,0.12)",border:"1px solid rgba(56,189,248,0.3)",borderRadius:12,color:"#38bdf8",fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Sök</button>
            </div>
            {clubs.map(club=>(
              <div key={club.id} onClick={()=>doJoinClub(club)} style={{padding:"14px 16px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,marginBottom:8,cursor:"pointer"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{club.name}</div>
              </div>
            ))}
            {clubs.length===0&&clubSearch&&<div style={{fontSize:12,color:"#4a5568",textAlign:"center",padding:16}}>Inga klubbar hittades</div>}
            {error&&<div style={{color:"#f87171",fontSize:12,marginBottom:10}}>{error}</div>}
            <button onClick={()=>setMode("choose_club")} style={{width:"100%",padding:"10px 0",border:"none",background:"none",color:"#4a5568",fontSize:13,fontFamily:"inherit",cursor:"pointer",marginTop:8}}>Tillbaka</button>
          </div>
        )}
      </div>
    </div>
  );
}

// MODALS
function NoteModal({player,onSave,onClose}){
  const [text,setText]=useState(player.note||"");
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#161926",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"20px 20px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:430}}>
        <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:4}}>Anteckning - {player.name}</div>
        <div style={{fontSize:11,color:"#4a5568",marginBottom:14}}>Börja med ⚠ för att markera skada</div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="T.ex. ⚠ skadad knä" style={{width:"100%",minHeight:80,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",fontSize:14,padding:12,fontFamily:"inherit",resize:"none",outline:"none",boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:10,marginTop:12}}>
          <button onClick={onClose} style={{flex:1,padding:"12px 0",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,background:"transparent",color:"#4a5568",fontSize:14,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Avbryt</button>
          <button onClick={()=>onSave(text)} style={{flex:1,padding:"12px 0",border:"none",borderRadius:12,background:"#a78bfa",color:"#fff",fontSize:14,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Spara</button>
        </div>
      </div>
    </div>
  );
}

function GoalModal({player,onSave,onClose}){
  const [goals,setGoals]=useState(player.goals||[]);
  const addGoal=()=>setGoals(g=>[...g,{id:Date.now(),season:"2024/25",type:"Mål",desc:""}]);
  const upd=(id,patch)=>setGoals(g=>g.map(x=>x.id===id?{...x,...patch}:x));
  const del=id=>setGoals(g=>g.filter(x=>x.id!==id));
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#161926",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"20px 20px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:16}}>Individuella mål - {player.name}</div>
        {goals.map(g=>(
          <div key={g.id} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:12,marginBottom:10}}>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <select value={g.season||"2024/25"} onChange={e=>upd(g.id,{season:e.target.value})} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#fff",fontSize:12,padding:"6px 8px",fontFamily:"inherit",outline:"none"}}>
                {["2024/25","2025/26"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select value={g.type||"Mål"} onChange={e=>upd(g.id,{type:e.target.value})} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#fff",fontSize:12,padding:"6px 8px",fontFamily:"inherit",outline:"none"}}>
                {["Mål","Teknik","Taktik","Mental","Fysik"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={()=>del(g.id)} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:16,padding:"0 4px"}}>×</button>
            </div>
            <input value={g.desc||""} onChange={e=>upd(g.id,{desc:e.target.value})} placeholder="Beskriv målet..." style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,color:"#fff",fontSize:13,padding:"8px 10px",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>
        ))}
        <button onClick={addGoal} style={{width:"100%",padding:"10px 0",border:"1px dashed rgba(167,139,250,0.3)",borderRadius:12,background:"transparent",color:"#a78bfa",fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer",marginBottom:14}}>+ Lägg till mål</button>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"12px 0",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,background:"transparent",color:"#4a5568",fontSize:14,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Stäng</button>
          <button onClick={()=>onSave(goals)} style={{flex:1,padding:"12px 0",border:"none",borderRadius:12,background:"#a78bfa",color:"#fff",fontSize:14,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Spara</button>
        </div>
      </div>
    </div>
  );
}

// MATCH CARD
function MatchCard({match,onEditNote,onDelete}){
  const [open,setOpen]=useState(false);
  const [confirmDel,setConfirmDel]=useState(false);
  const sc=match.serie==="14A"?"#f472b6":match.serie==="15A"?"#38bdf8":"#fbbf24";
  const hasResult=match.result&&(match.result.us!==""||match.result.them!=="");
  const scorers=match.scorers||[];
  const isObj=scorers.length>0&&typeof scorers[0]==="object";
  const goals=isObj?scorers.filter(s=>s.type==="goal"):scorers;
  const assists=isObj?scorers.filter(s=>s.type==="assist"):[];
  return(
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,overflow:"hidden",marginBottom:10}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",cursor:"pointer"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <span style={{fontSize:12,fontWeight:800,color:sc,background:sc+"18",border:"1px solid "+sc+"40",borderRadius:99,padding:"2px 8px"}}>{match.serie}</span>
            <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>vs {match.opponent}</span>
            {hasResult&&<span style={{fontSize:12,fontWeight:900,color:"#fff",background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"2px 8px"}}>{match.result.us}-{match.result.them}</span>}
          </div>
          <span style={{fontSize:11,color:"#4a5568"}}>{FMT(match.date)}</span>
        </div>
        <span style={{color:"#4a5568",fontSize:13}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"0 16px 16px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          {goals.length>0&&(
            <div style={{marginBottom:10}}>
              <div style={{fontSize:9,color:"#fbbf24",fontWeight:700,marginBottom:5}}>MÅL</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {goals.map((s,i)=><span key={i} style={{fontSize:12,color:"#fbbf24",background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:99,padding:"3px 10px"}}>{isObj?s.name:s}</span>)}
              </div>
            </div>
          )}
          {assists.length>0&&(
            <div style={{marginBottom:10}}>
              <div style={{fontSize:9,color:"#38bdf8",fontWeight:700,marginBottom:5}}>ASSIST</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {assists.map((s,i)=><span key={i} style={{fontSize:12,color:"#38bdf8",background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:99,padding:"3px 10px"}}>{s.name}</span>)}
              </div>
            </div>
          )}
          {match.note&&<div style={{fontSize:12,color:"#64748b",lineHeight:1.5,marginBottom:10}}>{match.note}</div>}
          <button onClick={()=>onEditNote(match)} style={{width:"100%",padding:"9px 0",border:"1px solid rgba(56,189,248,0.25)",borderRadius:10,background:"rgba(56,189,248,0.06)",color:"#38bdf8",fontSize:12,fontWeight:700,fontFamily:"inherit",cursor:"pointer",marginBottom:8}}>
            {match.note?"Redigera notering":"Lägg till notering"}
          </button>
          {!confirmDel
            ?<button onClick={()=>setConfirmDel(true)} style={{width:"100%",padding:"8px 0",border:"1px solid rgba(248,113,113,0.2)",borderRadius:10,background:"transparent",color:"#f87171",fontSize:11,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Ta bort match</button>
            :<div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmDel(false)} style={{flex:1,padding:"9px 0",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,background:"transparent",color:"#4a5568",fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>Avbryt</button>
              <button onClick={()=>onDelete(match.id)} style={{flex:2,padding:"9px 0",border:"none",borderRadius:10,background:"#f87171",color:"#fff",fontSize:12,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Ja ta bort</button>
            </div>
          }
        </div>
      )}
    </div>
  );
}

// FORMATION CARD
function FormationCard({line,lineIndex,allPlayers,usedIds,onAssign,onRemove,onRename,onDelete}){
  const [picking,setPicking]=useState(null);
  const [editing,setEditing]=useState(false);
  const drag=useRef(null);
  const touchRef=useRef(null);
  const available=allPlayers.filter(p=>!usedIds.has(p.id)&&!p.note.startsWith("⚠")&&p.role!=="malvakt");
  const filled=Object.values(line.slots).filter(Boolean).length;
  const rows=[["forward"],["vanster","hoger"],["back"]];
  return(
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,overflow:"hidden",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        {editing
          ?<input autoFocus value={line.name} onChange={e=>onRename(lineIndex,e.target.value)} onBlur={()=>setEditing(false)} onKeyDown={e=>e.key==="Enter"&&setEditing(false)} style={{background:"none",border:"none",borderBottom:"1px solid #a78bfa",color:"#a78bfa",fontSize:13,fontWeight:800,fontFamily:"inherit",outline:"none",width:130}}/>
          :<span onClick={()=>setEditing(true)} style={{fontSize:13,fontWeight:800,color:"#fff",cursor:"text"}}>{line.name} ✎</span>
        }
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:11,color:"#4a5568"}}>{filled}/4</span>
          <button onClick={()=>onDelete(lineIndex)} style={{background:"none",border:"none",color:"#334155",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>×</button>
        </div>
      </div>
      <div style={{padding:14,background:"rgba(0,0,0,0.2)"}}>
        <div style={{borderRadius:10,background:"linear-gradient(180deg,rgba(52,211,153,0.06) 0%,rgba(52,211,153,0.03) 100%)",border:"1px solid rgba(52,211,153,0.12)",padding:"14px 10px"}}>
          {rows.map((group,ri)=>(
            <div key={ri} style={{display:"flex",justifyContent:"center",gap:12,marginBottom:ri<2?12:0}}>
              {group.map(pos=>{
                const pid=line.slots[pos];
                const player=pid?allPlayers.find(p=>p.id===pid):null;
                const pc=PCOLOR[pos];
                const pgc=player?gc(player.group):null;
                return(
                  <div key={pos} data-pos={pos}
                    draggable={!!player}
                    onDragStart={()=>{drag.current=pos;}}
                    onDragOver={e=>e.preventDefault()}
                    onDrop={()=>{const f=drag.current;if(f&&f!==pos){onAssign(lineIndex,"__swap__",{from:f,to:pos});drag.current=null;}}}
                    onClick={()=>{if(!player)setPicking(pos);}}
                    onTouchStart={e=>{if(!player)return;touchRef.current={fromPos:pos,startX:e.touches[0].clientX,startY:e.touches[0].clientY,moved:false};}}
                    onTouchMove={e=>{if(!touchRef.current)return;const dx=e.touches[0].clientX-touchRef.current.startX;const dy=e.touches[0].clientY-touchRef.current.startY;if(Math.sqrt(dx*dx+dy*dy)>10){touchRef.current.moved=true;e.preventDefault();}}}
                    onTouchEnd={e=>{const td=touchRef.current;touchRef.current=null;if(!td||!td.moved)return;const t=e.changedTouches[0];const els=document.elementsFromPoint(t.clientX,t.clientY);for(const el of els){const slot=el.closest("[data-pos]");if(slot&&slot.dataset.pos!==td.fromPos){onAssign(lineIndex,"__swap__",{from:td.fromPos,to:slot.dataset.pos});break;}}}}
                    style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:player?"grab":"pointer"}}>
                    <div style={{width:56,height:56,borderRadius:"50%",background:player?pgc.bg:"rgba(255,255,255,0.03)",border:"2px "+(player?"solid":"dashed")+" "+(player?pgc.color:pc+"50"),display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
                      {player?(
                        <>
                          <span style={{fontSize:11,fontWeight:800,color:"#fff",textAlign:"center",lineHeight:1.15,padding:"0 4px"}}>{player.name.split(" ")[0]}</span>
                          <button onClick={e=>{e.stopPropagation();onRemove(lineIndex,pos);}} style={{position:"absolute",top:-4,right:-4,width:17,height:17,borderRadius:"50%",background:"#1a1f2e",border:"1px solid rgba(255,255,255,0.15)",color:"#888",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,padding:0}}>×</button>
                        </>
                      ):(
                        <span style={{fontSize:20,color:pc+"50",lineHeight:1}}>+</span>
                      )}
                    </div>
                    <span style={{fontSize:9,color:pc,fontWeight:700,letterSpacing:"0.06em"}}>{PLABEL[pos]}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {picking&&(
        <div style={{padding:"12px 16px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{fontSize:11,color:PCOLOR[picking],fontWeight:700,marginBottom:8}}>VÄLJ {PLABEL[picking]}</div>
          {available.length===0
            ?<div style={{fontSize:12,color:"#4a5568"}}>Inga lediga spelare</div>
            :<div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {available.map(p=>(
                <button key={p.id} onClick={()=>{onAssign(lineIndex,picking,p.id);setPicking(null);}} style={{background:gc(p.group).bg,border:"1px solid "+gc(p.group).border,borderRadius:99,padding:"5px 12px",color:gc(p.group).color,fontSize:12,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>{p.name}</button>
              ))}
            </div>
          }
          <button onClick={()=>setPicking(null)} style={{marginTop:10,background:"none",border:"none",color:"#4a5568",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Avbryt</button>
        </div>
      )}
    </div>
  );
}


// KEDJOR TAB
function KedjorTab({players,onUpdatePlayerGroup}){
  const [mode,setMode]=useState("scramble");
  const field=players.filter(p=>p.role!=="malvakt");
  return(
    <div>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["scramble","🎲 Scramble"],["grupper","🎨 Grupper"],["blanda","⚡ Blanda"]].map(([m,l])=>(
          <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"8px 0",border:"1px solid "+(mode===m?"#22c55e":"rgba(255,255,255,0.07)"),borderRadius:10,background:mode===m?"rgba(34,197,94,0.12)":"transparent",color:mode===m?"#22c55e":"#4a5568",fontSize:11,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      {mode==="scramble"&&<ScrambleMode players={players} field={field}/>}
      {mode==="grupper"&&<GrupperMode field={field} onUpdateGroup={onUpdatePlayerGroup}/>}
      {mode==="blanda"&&<BlandaMode field={field}/>}
    </div>
  );
}

function ScrambleMode({players,field}){
  const [present,setPresent]=useState(()=>ls.get("hibs_present",[])||[]);
  const [chains,setChains]=useState([]);
  const [size,setSize]=useState(4);
  const [done,setDone]=useState(false);
  const gk=players.filter(p=>p.role==="malvakt");
  useEffect(()=>{ls.set("hibs_present",present);},[present]);
  const toggle=id=>setPresent(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const doScramble=()=>{const s=shuffle(present);const r=[];for(let i=0;i<s.length;i+=size)r.push(s.slice(i,i+size));setChains(r);setDone(true);};
  const cnt=present.length;
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontSize:15,fontWeight:900,color:"#fff"}}>{cnt} valda</div>
        <button onClick={()=>setPresent(p=>p.length>=field.length?[]:field.map(x=>x.id))} style={{fontSize:11,fontWeight:700,color:"#22c55e",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:99,padding:"6px 14px",fontFamily:"inherit",cursor:"pointer"}}>
          {present.length>=field.length?"Rensa":"Välj alla"}
        </button>
      </div>
      {GROUPS.map(g=>{
        const gp=field.filter(p=>p.group===g);
        if(!gp.length)return null;
        return(
          <div key={g} style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:800,color:GC[g].color,letterSpacing:"0.1em",marginBottom:7}}>GRUPP {g}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {gp.map(p=>{const on=(present||[]).includes(p.id);const inj=p.note&&p.note?.startsWith("⚠");return(
                <button key={p.id} onClick={()=>!inj&&toggle(p.id)} style={{padding:"8px 15px",border:"1.5px solid "+(on?GC[g].color:inj?"rgba(255,80,80,0.3)":"rgba(255,255,255,0.08)"),borderRadius:99,background:on?GC[g].bg:inj?"rgba(255,80,80,0.05)":"transparent",color:on?GC[g].color:inj?"rgba(255,80,80,0.5)":"#4a5568",fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:inj?"not-allowed":"pointer"}}>{p.name}{inj?" ⚠":""}</button>
              );})}
            </div>
          </div>
        );
      })}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:10,fontWeight:800,color:GC.MV.color,letterSpacing:"0.1em",marginBottom:7}}>MÅLVAKTER</div>
        <div style={{display:"flex",gap:7}}>
          {gk.map(p=>{const on=(present||[]).includes(p.id);return(
            <button key={p.id} onClick={()=>toggle(p.id)} style={{padding:"8px 15px",border:"1.5px solid "+(on?GC.MV.color:"rgba(255,255,255,0.08)"),borderRadius:99,background:on?GC.MV.bg:"transparent",color:on?GC.MV.color:"#4a5568",fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>{p.name}</button>
          );})}
        </div>
      </div>
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:18,marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:800,color:"#fff",marginBottom:14}}>Kedjestorlek</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[3,4,5].map(n=><button key={n} onClick={()=>setSize(n)} style={{flex:1,padding:"12px 0",border:"2px solid "+(size===n?"#22c55e":"rgba(255,255,255,0.07)"),borderRadius:12,background:size===n?"rgba(34,197,94,0.12)":"transparent",color:size===n?"#22c55e":"#4a5568",fontSize:16,fontWeight:900,fontFamily:"inherit",cursor:"pointer"}}>{n}v{n}</button>)}
        </div>
        {cnt>0&&<div style={{fontSize:12,color:"#4a5568",textAlign:"center",marginBottom:14}}>{cnt} spelare - {Math.ceil(cnt/size)} kedjor</div>}
        <button onClick={doScramble} disabled={cnt<2} style={{width:"100%",padding:"15px 0",border:"none",borderRadius:13,background:cnt>=2?"linear-gradient(135deg,#22c55e,#16a34a)":"rgba(255,255,255,0.05)",color:cnt>=2?"#fff":"#4a5568",fontSize:15,fontWeight:900,fontFamily:"inherit",cursor:cnt>=2?"pointer":"not-allowed"}}>Scrambla kedjor</button>
      </div>
      {done&&chains.length>0&&(
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:16,fontWeight:900,color:"#fff"}}>Kedjorna</div>
            <button onClick={doScramble} style={{fontSize:11,fontWeight:700,color:"#22c55e",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:99,padding:"6px 14px",fontFamily:"inherit",cursor:"pointer"}}>Ny</button>
          </div>
          {chains.map((chain,ci)=>(
            <div key={ci} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,marginBottom:14,overflow:"hidden"}}>
              <div style={{background:"rgba(34,197,94,0.08)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:28,height:28,borderRadius:9,background:"rgba(34,197,94,0.18)",border:"1px solid rgba(34,197,94,0.35)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:13,fontWeight:900,color:"#22c55e"}}>{ci+1}</span></div>
                <span style={{fontSize:13,fontWeight:800,color:"#e2e8f0"}}>Kedja {ci+1}</span>
              </div>
              <div style={{padding:"8px 0"}}>
                {chain.map((id,pi)=>{const p=players.find(x=>x.id===id);if(!p)return null;const pos=CHAIN_POS[pi]||("Pos "+(pi+1));const pc=CHAIN_COL[pos]||"#64748b";return(
                  <div key={id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:pi<chain.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                    <span style={{fontSize:10,fontWeight:900,color:pc,background:pc+"15",border:"1px solid "+pc+"30",borderRadius:6,padding:"3px 6px",width:38,textAlign:"center",flexShrink:0}}>{pos}</span>
                    <div style={{width:8,height:8,borderRadius:"50%",background:gc(p.group).color,flexShrink:0}}/>
                    <span style={{fontSize:14,fontWeight:800,color:"#fff"}}>{p.name}</span>
                    <span style={{fontSize:10,color:"#4a5568",marginLeft:"auto"}}>Gr.{p.group}</span>
                  </div>
                );})}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GrupperMode({field,onUpdateGroup}){
  const [localGroups,setLocalGroups]=useState(()=>{const m={};field.forEach(p=>{m[p.id]=p.group;});return m;});
  const [moving,setMoving]=useState(null);
  const [confirmPerm,setConfirmPerm]=useState(null);
  const moveTemp=(id,toGroup)=>{setLocalGroups(m=>({...m,[id]:toGroup}));setMoving(null);};
  const movePerm=(id,toGroup)=>{onUpdateGroup(id,toGroup);setLocalGroups(m=>({...m,[id]:toGroup}));setConfirmPerm(null);setMoving(null);};
  return(
    <div>
      <div style={{fontSize:12,color:"#4a5568",marginBottom:14,lineHeight:1.5}}>Tryck på spelare för att flytta.</div>
      {moving&&(
        <div onClick={()=>setMoving(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#161926",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"20px 20px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430}}>
            <div style={{fontSize:15,fontWeight:900,color:"#fff",marginBottom:4}}>{moving.name}</div>
            <div style={{fontSize:12,color:"#4a5568",marginBottom:16}}>Grupp {moving.fromGroup} - välj ny grupp</div>
            <div style={{fontSize:11,color:"#4a5568",fontWeight:700,marginBottom:8}}>TILLFÄLLIGT</div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {GROUPS.filter(g=>g!==moving.fromGroup).map(g=>(
                <button key={g} onClick={()=>moveTemp(moving.id,g)} style={{flex:1,padding:"14px 0",border:"2px solid "+GC[g].color+"50",borderRadius:12,background:GC[g].bg,color:GC[g].color,fontSize:15,fontWeight:900,fontFamily:"inherit",cursor:"pointer"}}>{g}</button>
              ))}
            </div>
            <div style={{fontSize:11,color:"#4a5568",fontWeight:700,marginBottom:8}}>PERMANENT</div>
            <div style={{display:"flex",gap:8}}>
              {GROUPS.filter(g=>g!==moving.fromGroup).map(g=>(
                <button key={g} onClick={()=>setConfirmPerm({id:moving.id,name:moving.name,toGroup:g,fromGroup:moving.fromGroup})} style={{flex:1,padding:"10px 0",border:"1px solid "+GC[g].color+"40",borderRadius:10,background:"transparent",color:GC[g].color,fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>{g} ✦</button>
              ))}
            </div>
            <button onClick={()=>setMoving(null)} style={{marginTop:16,width:"100%",padding:"10px 0",border:"none",background:"none",color:"#4a5568",fontSize:13,fontFamily:"inherit",cursor:"pointer"}}>Avbryt</button>
          </div>
        </div>
      )}
      {confirmPerm&&(
        <div onClick={()=>setConfirmPerm(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:210,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#161926",border:"1px solid rgba(255,255,255,0.12)",borderRadius:20,padding:24,width:"100%",maxWidth:380}}>
            <div style={{fontSize:16,fontWeight:900,color:"#fff",marginBottom:8}}>Flytta permanent?</div>
            <div style={{fontSize:13,color:"#94a3b8",marginBottom:20,lineHeight:1.6}}>{confirmPerm.name} flyttas från grupp {confirmPerm.fromGroup} till grupp {confirmPerm.toGroup}.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmPerm(null)} style={{flex:1,padding:"12px 0",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,background:"transparent",color:"#4a5568",fontSize:13,fontFamily:"inherit",cursor:"pointer"}}>Avbryt</button>
              <button onClick={()=>movePerm(confirmPerm.id,confirmPerm.toGroup)} style={{flex:2,padding:"12px 0",border:"none",borderRadius:12,background:"#a78bfa",color:"#fff",fontSize:13,fontWeight:800,fontFamily:"inherit",cursor:"pointer"}}>Ja flytta</button>
            </div>
          </div>
        </div>
      )}
      {GROUPS.map(g=>{
        const gp=field.filter(p=>localGroups[p.id]===g);
        const tempOut=field.filter(p=>p.group===g&&localGroups[p.id]!==g);
        return(
          <div key={g} style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+GC[g].color+"25",borderRadius:16,padding:"14px 16px",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:GC[g].color}}/>
                <span style={{fontSize:13,fontWeight:900,color:GC[g].color}}>Grupp {g}</span>
                <span style={{fontSize:11,color:"#4a5568"}}>{gp.length} sp</span>
              </div>
              {tempOut.length>0&&<button onClick={()=>{const r={};tempOut.forEach(p=>{r[p.id]=p.group;});setLocalGroups(m=>({...m,...r}));}} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Återställ</button>}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {gp.map(p=>{const isTemp=p.group!==g;return(
                <button key={p.id} onClick={()=>setMoving({id:p.id,name:p.name,fromGroup:localGroups[p.id]})} style={{padding:"8px 14px",border:"1.5px solid "+(isTemp?GC[g].color+"80":GC[g].color),borderRadius:99,background:isTemp?GC[g].bg+"80":GC[g].bg,color:GC[g].color,fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer",opacity:isTemp?0.75:1}}>{p.name}{isTemp?" *":""}</button>
              );})}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BlandaMode({field}){
  const [mixes,setMixes]=useState([new Set(["A","B"]),new Set(["C","D","E"])]);
  const [size,setSize]=useState(4);
  const [results,setResults]=useState(null);
  const usedGroups=new Set(mixes.flatMap(m=>[...m]));
  const unusedGroups=GROUPS.filter(g=>!usedGroups.has(g));
  const toggleGroupInMix=(mi,g)=>{setMixes(ms=>{const next=ms.map((m,i)=>{if(i===mi){const s=new Set(m);s.has(g)?s.delete(g):s.add(g);return s;}const s=new Set(m);s.delete(g);return s;}).filter(s=>s.size>0);return next;});setResults(null);};
  const doScramble=()=>{setResults(mixes.map(mixSet=>{const pool=field.filter(p=>mixSet.has(p.group));const s=shuffle(pool.map(p=>p.id));const chains=[];for(let i=0;i<s.length;i+=size)chains.push(s.slice(i,i+size));return{mixSet,chains};}));};
  return(
    <div>
      <div style={{fontSize:12,color:"#4a5568",marginBottom:16,lineHeight:1.5}}>Välj vilka grupper som blandas ihop.</div>
      {mixes.map((mixSet,mi)=>(
        <div key={mi} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px 16px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:800,color:"#fff"}}>Mix {mi+1}</span>
            {mixes.length>1&&<button onClick={()=>{setMixes(ms=>ms.filter((_,i)=>i!==mi));setResults(null);}} style={{fontSize:11,color:"#f87171",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Ta bort</button>}
          </div>
          <div style={{display:"flex",gap:7}}>
            {GROUPS.map(g=>{const inThis=mixSet.has(g);const inOther=!inThis&&usedGroups.has(g);return(
              <button key={g} onClick={()=>!inOther&&toggleGroupInMix(mi,g)} style={{width:44,height:44,border:"2px solid "+(inThis?GC[g].color:inOther?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.12)"),borderRadius:12,background:inThis?GC[g].bg:"transparent",color:inThis?GC[g].color:inOther?"#1e293b":"#4a5568",fontSize:14,fontWeight:900,fontFamily:"inherit",cursor:inOther?"not-allowed":"pointer"}}>{g}</button>
            );})}
          </div>
          {mixSet.size>0&&<div style={{fontSize:11,color:"#4a5568",marginTop:8}}>{field.filter(p=>mixSet.has(p.group)).length} spelare</div>}
        </div>
      ))}
      {unusedGroups.length>0&&<button onClick={()=>{setMixes(ms=>[...ms,new Set([unusedGroups[0]])]);setResults(null);}} style={{width:"100%",padding:"10px 0",border:"1px dashed rgba(255,255,255,0.1)",borderRadius:12,background:"transparent",color:"#4a5568",fontSize:12,fontFamily:"inherit",cursor:"pointer",marginBottom:14}}>+ Lägg till mix ({unusedGroups.join(", ")} kvar)</button>}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:14,marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:800,color:"#fff",marginBottom:10}}>Kedjestorlek</div>
        <div style={{display:"flex",gap:8}}>{[3,4,5].map(n=><button key={n} onClick={()=>{setSize(n);setResults(null);}} style={{flex:1,padding:"10px 0",border:"2px solid "+(size===n?"#22c55e":"rgba(255,255,255,0.07)"),borderRadius:10,background:size===n?"rgba(34,197,94,0.12)":"transparent",color:size===n?"#22c55e":"#4a5568",fontSize:15,fontWeight:900,fontFamily:"inherit",cursor:"pointer"}}>{n}v{n}</button>)}</div>
      </div>
      <button onClick={doScramble} style={{width:"100%",padding:"15px 0",border:"none",borderRadius:13,background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",fontSize:15,fontWeight:900,fontFamily:"inherit",cursor:"pointer",marginBottom:16}}>Scrambla</button>
      {results&&results.map((r,ri)=>(
        <div key={ri} style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>{[...r.mixSet].map(g=><span key={g} style={{fontSize:12,fontWeight:900,color:GC[g].color,background:GC[g].bg,border:"1px solid "+GC[g].color+"40",borderRadius:99,padding:"3px 10px"}}>Grupp {g}</span>)}</div>
          {r.chains.map((chain,ci)=>(
            <div key={ci} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,marginBottom:8,overflow:"hidden"}}>
              <div style={{padding:"8px 14px",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:12,fontWeight:800,color:"#e2e8f0"}}>Kedja {ci+1}</div>
              <div style={{padding:"6px 0"}}>
                {chain.map((id,pi)=>{const p=field.find(x=>x.id===id);if(!p)return null;const pos=CHAIN_POS[pi]||("Pos "+(pi+1));const pc=CHAIN_COL[pos]||"#64748b";return(
                  <div key={id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",borderBottom:pi<chain.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                    <span style={{fontSize:10,fontWeight:900,color:pc,background:pc+"15",border:"1px solid "+pc+"30",borderRadius:6,padding:"2px 6px",width:38,textAlign:"center",flexShrink:0}}>{pos}</span>
                    <div style={{width:8,height:8,borderRadius:"50%",background:gc(p.group).color,flexShrink:0}}/>
                    <span style={{fontSize:13,fontWeight:800,color:"#fff"}}>{p.name}</span>
                    <span style={{fontSize:10,color:"#4a5568",marginLeft:"auto"}}>Gr.{p.group}</span>
                  </div>
                );})}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}


// PLANERA TAB
function PlaneraTab({exercises,trainHistory,onSave,onDelete}){
  const [phase,setPhase]=useState("build");
  const [plan,setPlan]=useState(()=>ls.get("hibs_plan_draft",[]));
  const [note,setNote]=useState(()=>ls.get("hibs_plan_note",""));
  const [picking,setPicking]=useState(false);
  const [cat,setCat]=useState("Alla");
  const [search,setSearch]=useState("");
  const [expandedId,setExpandedId]=useState(null);
  const [saved,setSaved]=useState(false);
  useEffect(()=>{ls.set("hibs_plan_draft",plan);},[plan]);
  useEffect(()=>{ls.set("hibs_plan_note",note);},[note]);
  const filtered=exercises.filter(e=>{
    if(cat!=="Alla"&&e.category!==cat)return false;
    if(search&&!e.name.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });
  const addEx=ex=>{setPlan(p=>[...p,{id:Date.now(),exercise:ex,minutes:10}]);setPicking(false);setSearch("");};
  const removeEx=id=>setPlan(p=>p.filter(x=>x.id!==id));
  const setMin=(id,val)=>setPlan(p=>p.map(x=>x.id===id?{...x,minutes:Math.max(1,parseInt(val)||1)}:x));
  const moveUp=idx=>{if(idx===0)return;setPlan(p=>{const a=[...p];[a[idx-1],a[idx]]=[a[idx],a[idx-1]];return a;});};
  const moveDown=idx=>{if(idx===plan.length-1)return;setPlan(p=>{const a=[...p];[a[idx],a[idx+1]]=[a[idx+1],a[idx]];return a;});};
  const totalMin=plan.reduce((s,x)=>s+(parseInt(x.minutes)||0),0);
  const handleSave=async()=>{
    if(!plan.length)return;
    const entry={date:TODAY(),exercises:plan.map(x=>({name:x.exercise.name,minutes:x.minutes,category:x.exercise.category})),totalMinutes:totalMin,note:note.trim()};
    await onSave(entry);
    setSaved(true);
    setTimeout(()=>{setPlan([]);setNote("");ls.set("hibs_plan_draft",[]);ls.set("hibs_plan_note","");setSaved(false);setPhase("history");},1200);
  };

  if(phase==="history")return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div style={{fontSize:16,fontWeight:900,color:"#fff"}}>Träningslogg</div>
        <button onClick={()=>setPhase("build")} style={{padding:"8px 16px",background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:99,color:"#22c55e",fontSize:12,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>+ Ny träning</button>
      </div>
      {trainHistory.length===0&&<div style={{textAlign:"center",padding:"48px 0",color:"#334155",fontSize:14}}>Inga träningar sparade ännu.</div>}
      {trainHistory.map(entry=>(
        <div key={entry.id} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"14px 16px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>{FMT(entry.date)}</div>
              <div style={{fontSize:11,color:"#4a5568",marginTop:2}}>{(entry.exercises||[]).length} övningar - {entry.total_minutes||entry.totalMinutes} min</div>
            </div>
          </div>
          {(entry.exercises||[]).map((ex,i)=>{const cc=CAT_COLOR[ex.category]||"#64748b";return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",background:"rgba(255,255,255,0.02)",borderRadius:8,marginBottom:4}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:cc,flexShrink:0}}/>
              <span style={{fontSize:12,color:"#cbd5e1",flex:1}}>{ex.name}</span>
              <span style={{fontSize:11,color:"#4a5568"}}>{ex.minutes} min</span>
            </div>
          );})}
          {entry.note&&<div style={{marginTop:8,background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:8,padding:"7px 10px",fontSize:12,color:"#94a3b8"}}>{entry.note}</div>}
          <button onClick={()=>onDelete(entry.id)} style={{marginTop:10,width:"100%",padding:"7px 0",border:"1px solid rgba(248,113,113,0.2)",borderRadius:8,background:"transparent",color:"#f87171",fontSize:11,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Ta bort</button>
        </div>
      ))}
    </div>
  );

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:16,fontWeight:900,color:"#fff"}}>Dagens träning</div>
        <button onClick={()=>setPhase("history")} style={{fontSize:11,color:"#4a5568",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Logg</button>
      </div>
      {plan.length>0&&<div style={{background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:12,color:"#22c55e",fontWeight:700}}>{plan.length} övningar</span><span style={{fontSize:12,color:"#22c55e",fontWeight:700}}>{totalMin} min</span></div>}
      {plan.length===0&&!picking&&<div style={{textAlign:"center",padding:"28px 0 12px",color:"#334155",fontSize:13}}>Tryck + för att lägga till övningar.</div>}
      {plan.map((item,idx)=>{const cc=CAT_COLOR[item.exercise.category]||"#64748b";const isExp=expandedId===item.id;return(
        <div key={item.id} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,marginBottom:8,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px"}}>
            <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}>
              <button onClick={()=>moveUp(idx)} style={{background:"none",border:"none",color:idx===0?"#1e293b":"#4a5568",cursor:idx===0?"default":"pointer",fontSize:11,padding:"2px 4px",lineHeight:1}}>▲</button>
              <button onClick={()=>moveDown(idx)} style={{background:"none",border:"none",color:idx===plan.length-1?"#1e293b":"#4a5568",cursor:idx===plan.length-1?"default":"pointer",fontSize:11,padding:"2px 4px",lineHeight:1}}>▼</button>
            </div>
            <div style={{width:24,height:24,borderRadius:"50%",background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,fontWeight:900,color:"#22c55e"}}>{idx+1}</span></div>
            <div style={{flex:1,minWidth:0}} onClick={()=>setExpandedId(isExp?null:item.id)}>
              <div style={{fontSize:13,fontWeight:800,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.exercise.name}</div>
              <div style={{fontSize:10,color:cc,marginTop:2}}>{item.exercise.category}</div>
            </div>
            <input type="number" value={item.minutes} onChange={e=>setMin(item.id,e.target.value)} style={{width:52,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,color:"#fff",fontSize:13,fontWeight:700,padding:"4px 8px",fontFamily:"inherit",outline:"none",textAlign:"center"}}/>
            <span style={{fontSize:10,color:"#4a5568"}}>min</span>
            <button onClick={()=>removeEx(item.id)} style={{background:"none",border:"none",color:"#334155",cursor:"pointer",fontSize:16,padding:"0 2px",flexShrink:0}}>×</button>
          </div>
          {isExp&&item.exercise.vad&&<div style={{padding:"0 14px 10px",borderTop:"1px solid rgba(255,255,255,0.05)",fontSize:12,color:"#64748b",lineHeight:1.5}}>{item.exercise.vad}</div>}
        </div>
      );})}
      {!picking&&<button onClick={()=>setPicking(true)} style={{width:"100%",padding:12,border:"1px dashed rgba(34,197,94,0.3)",borderRadius:14,background:"rgba(34,197,94,0.04)",color:"#22c55e",fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer",marginBottom:12}}>+ Lägg till övning</button>}
      {picking&&(
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:14,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>Välj övning</div>
            <button onClick={()=>{setPicking(false);setSearch("");}} style={{background:"none",border:"none",color:"#4a5568",cursor:"pointer",fontSize:20}}>×</button>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Sök..." style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontSize:13,padding:"8px 12px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
          <div style={{overflowX:"auto",paddingBottom:4,marginBottom:8}}>
            <div style={{display:"flex",gap:6,width:"max-content"}}>
              {CATEGORIES.map(c=><button key={c} onClick={()=>setCat(c)} style={{padding:"4px 10px",border:"1px solid "+(cat===c?"#22c55e":"rgba(255,255,255,0.07)"),borderRadius:99,background:cat===c?"rgba(34,197,94,0.12)":"transparent",color:cat===c?"#22c55e":"#4a5568",fontSize:10,fontWeight:700,fontFamily:"inherit",cursor:"pointer",whiteSpace:"nowrap"}}>{c}</button>)}
            </div>
          </div>
          <div style={{maxHeight:260,overflowY:"auto",display:"flex",flexDirection:"column",gap:5}}>
            {filtered.map(ex=>{const alreadyIn=plan.some(p=>p.exercise.id===ex.id);const cc=CAT_COLOR[ex.category]||"#64748b";return(
              <div key={ex.id} onClick={()=>!alreadyIn&&addEx(ex)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:alreadyIn?"rgba(255,255,255,0.01)":"rgba(255,255,255,0.04)",border:"1px solid "+(alreadyIn?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.08)"),borderRadius:10,cursor:alreadyIn?"default":"pointer",opacity:alreadyIn?0.4:1}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:cc,flexShrink:0}}/>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{ex.name}</div><div style={{fontSize:10,color:"#4a5568"}}>{ex.category}</div></div>
                {alreadyIn?<span style={{fontSize:10,color:"#334155",fontWeight:700}}>Vald</span>:<span style={{fontSize:18,color:"#22c55e",fontWeight:300}}>+</span>}
              </div>
            );})}
          </div>
        </div>
      )}
      {plan.length>0&&(
        <>
          <div style={{fontSize:11,color:"#4a5568",fontWeight:700,marginBottom:6}}>NOTERING</div>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Hur gick det? Vad ska vi jobba mer på?" style={{width:"100%",minHeight:76,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"#fff",fontSize:13,padding:12,fontFamily:"inherit",resize:"none",outline:"none",boxSizing:"border-box",lineHeight:1.6,marginBottom:12}}/>
          <button onClick={handleSave} style={{width:"100%",padding:"14px 0",border:"none",borderRadius:13,background:saved?"#34d399":"#22c55e",color:"#0b0d14",fontSize:15,fontWeight:900,fontFamily:"inherit",cursor:"pointer"}}>{saved?"Sparad! ✓":"Spara träning"}</button>
        </>
      )}
    </div>
  );
}

// ÖVNINGAR TAB
function OvningarTab({token}){
  const [exercises,setExercises]=useState([]);
  const [loading,setLoading]=useState(true);
  const [cat,setCat]=useState("Alla");
  const [intensity,setIntensity]=useState("Alla");
  const [search,setSearch]=useState("");
  const [sel,setSel]=useState(null);

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const res=await sbGet("exercises","order=name.asc",token);
      if(Array.isArray(res))setExercises(res);
      setLoading(false);
    })();
  },[]);

  const filtered=exercises.filter(e=>{
    if(cat!=="Alla"&&e.category!==cat)return false;
    if(intensity!=="Alla"&&e.intensity!==intensity)return false;
    if(search&&!e.name.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });

  return(
    <div>
      <div style={{marginBottom:12}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Sök övning..." style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,color:"#fff",fontSize:13,padding:"10px 14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
      </div>
      <div style={{overflowX:"auto",marginBottom:8,paddingBottom:2}}>
        <div style={{display:"flex",gap:6,width:"max-content"}}>
          {CATEGORIES.map(c=><button key={c} onClick={()=>setCat(c)} style={{padding:"5px 11px",border:"1px solid "+(cat===c?"#22c55e":"rgba(255,255,255,0.07)"),borderRadius:99,background:cat===c?"rgba(34,197,94,0.12)":"transparent",color:cat===c?"#22c55e":"#4a5568",fontSize:11,fontWeight:700,fontFamily:"inherit",cursor:"pointer",whiteSpace:"nowrap"}}>{c}</button>)}
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {INTENSITIES.map(i=><button key={i} onClick={()=>setIntensity(i)} style={{flex:1,padding:"5px 0",border:"1px solid "+(intensity===i?"#22c55e":"rgba(255,255,255,0.07)"),borderRadius:99,background:intensity===i?"rgba(34,197,94,0.12)":"transparent",color:intensity===i?"#22c55e":"#4a5568",fontSize:11,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>{i}</button>)}
      </div>
      {loading&&<div style={{textAlign:"center",color:"#4a5568",fontSize:13,padding:16}}>Laddar...</div>}
      <div style={{fontSize:11,color:"#4a5568",marginBottom:8}}>{filtered.length} övningar</div>
      {filtered.map(ex=>{const cc=CAT_COLOR[ex.category]||"#64748b";return(
        <div key={ex.id} onClick={()=>setSel(ex)} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 16px",marginBottom:8,cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
            <div style={{flex:1}}>
              <span style={{fontSize:10,fontWeight:800,color:cc,background:cc+"15",border:"1px solid "+cc+"25",borderRadius:99,padding:"2px 8px"}}>{ex.category}</span>
              <div style={{fontSize:15,fontWeight:800,color:"#fff",marginTop:5}}>{ex.name}</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2,lineHeight:1.4}}>{ex.vad}</div>
            </div>
            <div style={{flexShrink:0,textAlign:"right"}}>
              {ex.players&&<div style={{fontSize:11,color:"#4a5568"}}>{ex.players} sp</div>}
              <div style={{fontSize:11,marginTop:2,color:ex.intensity==="Hög"?"#f87171":ex.intensity==="Medel"?"#fbbf24":"#34d399"}}>{ex.intensity}</div>
            </div>
          </div>
        </div>
      );})}
      {sel&&(
        <div onClick={()=>setSel(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#161926",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"20px 20px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
              <div>
                <span style={{fontSize:10,fontWeight:800,color:CAT_COLOR[sel.category]||"#64748b",background:(CAT_COLOR[sel.category]||"#64748b")+"18",border:"1px solid "+(CAT_COLOR[sel.category]||"#64748b")+"30",borderRadius:99,padding:"3px 10px"}}>{sel.category}</span>
                <div style={{fontSize:20,fontWeight:900,color:"#fff",marginTop:8}}>{sel.name}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                {sel.players&&<div style={{fontSize:11,color:"#4a5568"}}>{sel.players} sp</div>}
                <div style={{fontSize:11,color:sel.intensity==="Hög"?"#f87171":sel.intensity==="Medel"?"#fbbf24":"#34d399"}}>{sel.intensity}</div>
              </div>
            </div>
            {[["VAD",sel.vad],["VARFÖR",sel.varfor],["HUR",sel.hur],["ORGANISATION",sel.organisation]].filter(([,t])=>t).map(([l,t])=>(
              <div key={l} style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#4a5568",fontWeight:700,marginBottom:4}}>{l}</div>
                <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.6}}>{t}</div>
              </div>
            ))}
            {(sel.tips||[]).length>0&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#4a5568",fontWeight:700,marginBottom:6}}>TIPS</div>
                {(sel.tips||[]).map((t,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:4}}><div style={{width:5,height:5,borderRadius:"50%",background:"#22c55e",marginTop:5,flexShrink:0}}/><span style={{fontSize:13,color:"#94a3b8"}}>{t}</span></div>)}
              </div>
            )}
            {(sel.coaching_fragor||[]).length>0&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#4a5568",fontWeight:700,marginBottom:6}}>COACHINGFRÅGOR</div>
                {(sel.coaching_fragor||[]).map((t,i)=><div key={i} style={{fontSize:13,color:"#38bdf8",marginBottom:4}}>- {t}</div>)}
              </div>
            )}
            <button onClick={()=>setSel(null)} style={{width:"100%",padding:"12px 0",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,background:"transparent",color:"#4a5568",fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Stäng</button>
          </div>
        </div>
      )}
    </div>
  );
}


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

  // TABS
  const TABS=[{id:"home",icon:"🏠"},{id:"traning",icon:"🏋"},{id:"match",icon:"⚡"},{id:"mer",icon:"☰"}];

  // ── HOME (inlined - uses closure vars directly)
  const _HomeContent=()=>(
    <div>
      {injured.length>0&&(
        <div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:14,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:800,color:"#f87171",marginBottom:6}}>SKADADE SPELARE</div>
          {injured.map(p=><div key={p.id} style={{fontSize:13,color:"#fca5a5",marginBottom:2}}>{p.name} - {p.note.slice(1).trim()}</div>)}
        </div>
      )}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"16px 18px",marginBottom:16}}>
        <div style={{fontSize:10,color:"#4a5568",fontWeight:700,marginBottom:12}}>NÄSTA MATCH</div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <StableInput value={nextMatch.opponent} onChange={e=>setNextMatch(n=>({...n,opponent:e.target.value}))} placeholder="Motståndare" style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#fff",fontSize:13,padding:"8px 12px",fontFamily:"inherit",outline:"none"}}/>
          <input type="date" value={nextMatch.date} onChange={e=>setNextMatch(n=>({...n,date:e.target.value}))} style={{width:120,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#fff",fontSize:13,padding:"8px 10px",fontFamily:"inherit",outline:"none",colorScheme:"dark"}}/>
        </div>
        <div style={{display:"flex",gap:6}}>
          {SERIES.map(s=><button key={s} onClick={()=>setNextMatch(n=>({...n,serie:s}))} style={{flex:1,padding:"7px 0",border:"1px solid "+(nextMatch.serie===s?"#f472b6":"rgba(255,255,255,0.07)"),borderRadius:8,background:nextMatch.serie===s?"rgba(244,114,182,0.1)":"transparent",color:nextMatch.serie===s?"#f472b6":"#4a5568",fontSize:11,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>{s}</button>)}
        </div>
        {nextMatch.opponent&&nextMatch.date&&(
          <div style={{marginTop:12,textAlign:"center"}}>
            <div style={{fontSize:17,fontWeight:900,color:"#fff"}}>vs {nextMatch.opponent}</div>
            <div style={{fontSize:13,color:"#4a5568",marginTop:3}}>{FMT(nextMatch.date)}</div>
            <div style={{fontSize:12,color:"#f472b6",marginTop:2}}>{nextMatch.serie}</div>
            {(()=>{const d=Math.ceil((new Date(nextMatch.date)-new Date())/(1000*60*60*24));return d>0?<div style={{fontSize:12,color:"#4a5568",marginTop:3}}>Om {d} dagar</div>:d===0?<div style={{fontSize:13,color:"#22c55e",fontWeight:700,marginTop:3}}>Idag!</div>:null;})()}
          </div>
        )}
      </div>
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
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"16px 18px",marginBottom:16}}>
        <div style={{fontSize:10,color:"#4a5568",fontWeight:700,marginBottom:10}}>TRÄNINGSNOTISER</div>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <StableInput value={trainNoteInput} onChange={e=>setTrainNoteInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&trainNoteInput.trim()){const txt=trainNoteInput.trim();sbPost("training_notes",{club_id:clubId,text:txt,created_by:auth.uid},tok).then(r=>{const s=Array.isArray(r)&&r[0]?r[0]:{id:Date.now(),text:txt};setTrainNotes(n=>[s,...n]);});setTrainNoteInput("");}}} placeholder="Något att ta upp på träning..." style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#fff",fontSize:13,padding:"9px 12px",fontFamily:"inherit",outline:"none"}}/>
          <button onClick={()=>{if(!trainNoteInput.trim())return;const txt=trainNoteInput.trim();sbPost("training_notes",{club_id:clubId,text:txt,created_by:auth.uid},tok).then(r=>{const s=Array.isArray(r)&&r[0]?r[0]:{id:Date.now(),text:txt};setTrainNotes(n=>[s,...n]);});setTrainNoteInput("");}} style={{padding:"9px 14px",background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:10,color:"#22c55e",fontSize:18,fontFamily:"inherit",cursor:"pointer",fontWeight:300}}>+</button>
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

  // ── MATCH CONTENT
  const _MatchContent=()=>{
    if(activeMatch)return(
      <div>
        <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:14,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><div style={{fontSize:14,fontWeight:800,color:"#22c55e"}}>LIVE - vs {activeMatch.opponent}</div><div style={{fontSize:11,color:"#4a5568",marginTop:2}}>{FMT(activeMatch.date)} - {activeMatch.serie}</div></div>
          <div style={{fontSize:28,fontWeight:900,color:"#fff"}}>{matchResult.us||0}-{matchResult.them||0}</div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <div style={{flex:1,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:14,textAlign:"center"}}>
            <div style={{fontSize:10,color:"#22c55e",fontWeight:700,marginBottom:8}}>HIBS</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <button onClick={()=>setMatchResult(r=>({...r,us:Math.max(0,(parseInt(r.us)||0)-1)}))} style={{width:32,height:32,border:"1px solid rgba(255,255,255,0.1)",borderRadius:"50%",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:18,fontFamily:"inherit",cursor:"pointer"}}>-</button>
              <span style={{fontSize:32,fontWeight:900,color:"#fff",minWidth:32,textAlign:"center"}}>{matchResult.us||0}</span>
              <button onClick={()=>setMatchResult(r=>({...r,us:(parseInt(r.us)||0)+1}))} style={{width:32,height:32,border:"none",borderRadius:"50%",background:"#22c55e",color:"#0b0d14",fontSize:18,fontFamily:"inherit",cursor:"pointer",fontWeight:700}}>+</button>
            </div>
          </div>
          <div style={{flex:1,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:14,textAlign:"center"}}>
            <div style={{fontSize:10,color:"#f87171",fontWeight:700,marginBottom:8}}>MOT</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <button onClick={()=>setMatchResult(r=>({...r,them:Math.max(0,(parseInt(r.them)||0)-1)}))} style={{width:32,height:32,border:"1px solid rgba(255,255,255,0.1)",borderRadius:"50%",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:18,fontFamily:"inherit",cursor:"pointer"}}>-</button>
              <span style={{fontSize:32,fontWeight:900,color:"#fff",minWidth:32,textAlign:"center"}}>{matchResult.them||0}</span>
              <button onClick={()=>setMatchResult(r=>({...r,them:(parseInt(r.them)||0)+1}))} style={{width:32,height:32,border:"none",borderRadius:"50%",background:"#f87171",color:"#fff",fontSize:18,fontFamily:"inherit",cursor:"pointer",fontWeight:700}}>+</button>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:"#fbbf24",fontWeight:700,marginBottom:8}}>MÅL</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {players.filter(p=>(activeMatch.players||[]).includes(p.id)||(activeMatch.goalkeeper||[]).includes(p.id)).map(p=>{
                const cnt=matchScorers.filter(s=>s.name===p.name&&s.type==="goal").length;
                return(
                  <button key={p.id} onClick={()=>setMatchScorers(s=>[...s,{name:p.name,type:"goal"}])} style={{padding:"6px 12px",border:"1px solid "+(cnt>0?"rgba(251,191,36,0.4)":"rgba(255,255,255,0.07)"),borderRadius:99,background:cnt>0?"rgba(251,191,36,0.1)":"transparent",color:cnt>0?"#fbbf24":"#4a5568",fontSize:12,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>
                    {p.name}{cnt>0?" ("+cnt+")":""}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:"#38bdf8",fontWeight:700,marginBottom:8}}>ASSIST</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {players.filter(p=>(activeMatch.players||[]).includes(p.id)||(activeMatch.goalkeeper||[]).includes(p.id)).map(p=>{
                const cnt=matchScorers.filter(s=>s.name===p.name&&s.type==="assist").length;
                return(
                  <button key={p.id} onClick={()=>setMatchScorers(s=>[...s,{name:p.name,type:"assist"}])} style={{padding:"6px 12px",border:"1px solid "+(cnt>0?"rgba(56,189,248,0.4)":"rgba(255,255,255,0.07)"),borderRadius:99,background:cnt>0?"rgba(56,189,248,0.1)":"transparent",color:cnt>0?"#38bdf8":"#4a5568",fontSize:12,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>
                    {p.name}{cnt>0?" ("+cnt+")":""}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {matchScorers.length>0&&(
          <div style={{marginBottom:14}}>
            <button onClick={()=>setMatchScorers(s=>s.slice(0,-1))} style={{padding:"8px 16px",border:"1px solid rgba(255,255,255,0.08)",borderRadius:99,background:"transparent",color:"#4a5568",fontSize:12,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Ångra senaste</button>
          </div>
        )}
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <button onClick={endMatch} style={{flex:2,padding:"15px 0",border:"none",borderRadius:14,background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",fontSize:15,fontWeight:900,fontFamily:"inherit",cursor:"pointer"}}>Avsluta match</button>
          <button onClick={()=>setConfirmAbort(true)} style={{flex:1,padding:"15px 0",border:"1px solid rgba(248,113,113,0.25)",borderRadius:14,background:"transparent",color:"#f87171",fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>Avbryt</button>
        </div>
        {confirmAbort&&(
          <div onClick={()=>setConfirmAbort(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#161926",border:"1px solid rgba(255,255,255,0.12)",borderRadius:20,padding:24,width:"100%",maxWidth:360}}>
              <div style={{fontSize:16,fontWeight:900,color:"#fff",marginBottom:8}}>Avbryta matchen?</div>
              <div style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>Resultat och målgörare sparas inte.</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setConfirmAbort(false)} style={{flex:1,padding:"12px 0",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,background:"transparent",color:"#4a5568",fontSize:13,fontFamily:"inherit",cursor:"pointer"}}>Fortsätt</button>
                <button onClick={abortMatch} style={{flex:2,padding:"12px 0",border:"none",borderRadius:12,background:"#f87171",color:"#fff",fontSize:13,fontWeight:800,fontFamily:"inherit",cursor:"pointer"}}>Ja avbryt</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );

    if(matchStep==="lines")return(
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:900,color:"#fff"}}>Kedjor</div>
          <button onClick={()=>setMatchStep("select")} style={{fontSize:12,color:"#4a5568",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Tillbaka</button>
        </div>
        {lines.map((line,li)=>(
          <FormationCard key={line.id} line={line} lineIndex={li} allPlayers={players.filter(p=>selected.has(p.id))} usedIds={usedInLines} onAssign={assignSlot} onRemove={removeSlot} onRename={renameLine} onDelete={deleteLine}/>
        ))}
        <button onClick={()=>setLines(ls2=>[...ls2,mkLine(ls2.length+1)])} style={{width:"100%",padding:"12px 0",border:"1px dashed rgba(255,255,255,0.1)",borderRadius:14,background:"transparent",color:"#4a5568",fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer",marginBottom:14}}>+ Ny linje</button>
        <button onClick={startMatch} style={{width:"100%",padding:"15px 0",border:"none",borderRadius:14,background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",fontSize:15,fontWeight:900,fontFamily:"inherit",cursor:"pointer"}}>Starta match</button>
      </div>
    );

    return(
      <div>
        <div style={{fontSize:16,fontWeight:900,color:"#fff",marginBottom:16}}>Trupp</div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input type="date" value={matchDate} onChange={e=>setMatchDate(e.target.value)} style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#fff",fontSize:13,padding:"10px 12px",fontFamily:"inherit",outline:"none",colorScheme:"dark"}}/>
          <StableInput value={opponent} onChange={e=>setOpponent(e.target.value)} placeholder="Motståndare" style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#fff",fontSize:13,padding:"10px 12px",fontFamily:"inherit",outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {SERIES.map(s=><button key={s} onClick={()=>setSerie(s)} style={{flex:1,padding:"8px 0",border:"1px solid "+(serie===s?"#f472b6":"rgba(255,255,255,0.07)"),borderRadius:8,background:serie===s?"rgba(244,114,182,0.1)":"transparent",color:serie===s?"#f472b6":"#4a5568",fontSize:11,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>{s}</button>)}
        </div>
        <div style={{fontSize:10,color:"#4a5568",fontWeight:700,marginBottom:8}}>VÄLJ MÅLVAKT</div>
        <div style={{display:"flex",gap:7,marginBottom:14}}>
          {gkPlayers.map(p=>{const on=(goalkeeper||[]).includes(p.id);return(
            <button key={p.id} onClick={()=>setGoalkeeper(g=>g.includes(p.id)?g.filter(x=>x!==p.id):[...g,p.id])} style={{padding:"8px 16px",border:"1.5px solid "+(on?GC.MV.color:"rgba(255,255,255,0.08)"),borderRadius:99,background:on?GC.MV.bg:"transparent",color:on?GC.MV.color:"#4a5568",fontSize:13,fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>{p.name}</button>
          );})}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:10,color:"#4a5568",fontWeight:700}}>VÄLJ UTESPELARE ({selected.size} valda)</div>
          <button onClick={()=>setSelected(s=>s.size>=field.length?new Set():new Set(field.map(x=>x.id)))} style={{fontSize:10,color:"#22c55e",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>{selected.size>=field.length?"Rensa":"Välj alla"}</button>
        </div>
        {GROUPS.map(g=>{const gp=field.filter(p=>p.group===g);if(!gp.length)return null;return(
          <div key={g} style={{marginBottom:10}}>
            <div style={{fontSize:9,color:GC[g].color,fontWeight:700,marginBottom:5}}>GRUPP {g}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {gp.map(p=>{const on=selected.has(p.id);const inj=p.note&&p.note?.startsWith("⚠");return(
                <button key={p.id} onClick={()=>!inj&&toggleSelected(p.id)} style={{padding:"7px 14px",border:"1.5px solid "+(on?GC[g].color:inj?"rgba(255,80,80,0.3)":"rgba(255,255,255,0.08)"),borderRadius:99,background:on?GC[g].bg:inj?"rgba(255,80,80,0.05)":"transparent",color:on?GC[g].color:inj?"rgba(255,80,80,0.4)":"#4a5568",fontSize:12,fontWeight:700,fontFamily:"inherit",cursor:inj?"not-allowed":"pointer"}}>{p.name}{inj?" ⚠":""}</button>
              );})}
            </div>
          </div>
        );})}
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={()=>{if(selected.size>0&&opponent.trim())setMatchStep("lines");}} disabled={selected.size===0||!opponent.trim()} style={{flex:1,padding:"14px 0",border:"1px solid rgba(167,139,250,0.3)",borderRadius:14,background:"rgba(167,139,250,0.08)",color:selected.size>0&&opponent.trim()?"#a78bfa":"#334155",fontSize:14,fontWeight:700,fontFamily:"inherit",cursor:selected.size>0&&opponent.trim()?"pointer":"not-allowed"}}>Kedjor</button>
          <button onClick={()=>{if(selected.size>0&&opponent.trim())startMatch();}} disabled={selected.size===0||!opponent.trim()} style={{flex:2,padding:"14px 0",border:"none",borderRadius:14,background:selected.size>0&&opponent.trim()?"linear-gradient(135deg,#22c55e,#16a34a)":"rgba(255,255,255,0.05)",color:selected.size>0&&opponent.trim()?"#fff":"#334155",fontSize:15,fontWeight:900,fontFamily:"inherit",cursor:selected.size>0&&opponent.trim()?"pointer":"not-allowed"}}>Starta match</button>
        </div>
      </div>
    );
  };

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
        {tab==="home"&&_HomeContent()}
        {tab==="traning"&&trainSub==="kedjor"&&<KedjorTab players={players} onUpdatePlayerGroup={async(id,group)=>{setPlayers(p=>p.map(x=>x.id===id?{...x,group}:x));await sbPatch("players",id,{group},tok);}}/>}
        {tab==="traning"&&trainSub==="planera"&&<PlaneraTab exercises={exercises} trainHistory={trainHistory}
          onSave={async entry=>{const row={club_id:clubId,date:entry.date,exercises:entry.exercises,total_minutes:entry.totalMinutes,note:entry.note||"",created_by:auth.uid};const saved=await sbPost("training_sessions",row,tok);const s=Array.isArray(saved)&&saved[0]?saved[0]:{...row,id:Date.now()};setTrainHistory(p=>[s,...p]);}}
          onDelete={async id=>{await sbDel("training_sessions",id,tok);setTrainHistory(p=>p.filter(x=>x.id!==id));}}
        />}
        {tab==="traning"&&trainSub==="ovningar"&&<OvningarTab token={tok}/>}
        {tab==="match"&&_MatchContent()}
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
