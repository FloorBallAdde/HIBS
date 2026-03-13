/**
 * BottomNav — fast navigationsfält längst ner.
 * Extraherad från App.jsx i Sprint 7.
 * Props: tab, setTab, setMerSub
 */
export default function BottomNav({ tab, setTab, setMerSub }) {
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(11,13,20,0.97)",backdropFilter:"blur(12px)",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",zIndex:100}}>
      {[{id:"home",icon:"🏠",label:"Hem"},{id:"traning",icon:"🏋",label:"Träning"},{id:"match",icon:"⚡",label:"Match"},{id:"mer",icon:"☰",label:"Mer"}].map(t=>(
        <button key={t.id} onClick={()=>{setTab(t.id);if(t.id!=="mer")setMerSub(null);}} style={{flex:1,padding:"10px 0 14px",border:"none",background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",color:tab===t.id?"#22c55e":"#4a5568",fontFamily:"inherit"}}>
          <span style={{fontSize:20}}>{t.icon}</span>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.04em"}}>{t.label.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
