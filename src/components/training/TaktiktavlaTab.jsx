/**
 * TaktiktavlaTab — Officiell innebandyplan (IFF-standard).
 * Verktyg: penna, pil, sudd, ångra, rensa
 *          + spelare 1–10 (röd/blå) + koner (stora) + innebandyboll
 * Tokens (spelare/kon/boll) är rörliga overlay-element — streck & pilar stannar på canvasen.
 * Apple Pencil-stöd via Pointer Events med tryckkänslighet.
 * Sprint 56: all canvas/token-logik extraherad till hooks/useTaktiktavlaCanvas.js —
 * den här filen är enbart presentation (toolbar/board/status).
 */
import { useTaktiktavlaCanvas } from "../../hooks/useTaktiktavlaCanvas";
import TokenOverlay from "./TokenOverlay";

const PEN_COLORS  = [{ hex: "#ffffff" }, { hex: "#ef4444" }, { hex: "#fbbf24" }, { hex: "#22c55e" }];
const PEN_SIZES   = [2, 4, 7];
const PLAYER_COLS = [{ hex: "#ef4444", label: "Röd" }, { hex: "#38bdf8", label: "Blå" }];

/* ─────────── Main component ─────────── */
export default function TaktiktavlaTab({ onSave = null, onCancel = null }) {
  const {
    canvasRef, wrapperRef,
    tool, setTool, penColor, setPenColor, penSize, setPenSize,
    playerNum, setPlayerNum, playerColor, setPlayerColor,
    tokens, fullscreen, setFullscreen, confirmClear,
    undo, handleClearClick, exportDrawing, handleSparaDela,
    onCanvasDown, onCanvasMove, onCanvasUp,
    onTokenDown, onTokenMove, onTokenUp, onTokenDelete,
  } = useTaktiktavlaCanvas();

  const isPortrait = typeof window !== "undefined" && window.innerHeight > window.innerWidth;

  /* ── Style helpers ── */
  const tb = (active, accent) => ({
    display:"flex", alignItems:"center", justifyContent:"center",
    borderRadius:9, height:34,
    border:"1.5px solid "+(active?(accent||"#fff"):"rgba(255,255,255,0.1)"),
    background: active?"rgba(255,255,255,0.1)":"transparent",
    color: active?"#fff":"#4a5568",
    cursor:"pointer", fontFamily:"inherit", fontSize:13, flexShrink:0, padding:"0 7px",
  });
  const sep = <div style={{ width:1, height:22, background:"rgba(255,255,255,0.08)", flexShrink:0 }} />;

  /* ── Toolbar JSX (inline function, not component) ── */
  const toolbarJSX = (compact = false) => (
    <div style={{ display:"flex", alignItems:"center", gap:compact?3:4, padding:compact?"4px 4px":"6px 4px", borderBottom:"1px solid rgba(255,255,255,0.06)", overflowX:"auto", flexShrink:0, background:"#0d1117" }}>

      {/* Select / move tool */}
      <button onClick={() => setTool("select")}
        style={{ ...tb(tool==="select","#a78bfa"), padding:"0 8px", gap:4, fontSize:13, fontWeight: tool==="select"?800:600,
          background: tool==="select"?"rgba(167,139,250,0.18)":"transparent",
          border:"1.5px solid "+(tool==="select"?"#a78bfa":"rgba(255,255,255,0.15)"),
          color: tool==="select"?"#a78bfa":"#6b7280",
        }} title="Flytta – klicka aldrig ut nya tokens">
        <span style={{fontSize:15}}>↖</span>
        <span style={{fontSize:11}}>Flytta</span>
      </button>
      {sep}

      {/* Pen sizes */}
      {PEN_SIZES.map(s => (
        <button key={s} onClick={() => { setTool("pen"); setPenSize(s); }} style={{ ...tb(tool==="pen"&&penSize===s), width:30 }}>
          <div style={{ width:s*2.8, height:s*2.8, borderRadius:"50%", background:tool==="pen"&&penSize===s?penColor:"#4a5568" }} />
        </button>
      ))}
      {sep}

      {/* Pen colors */}
      {PEN_COLORS.map(c => (
        <button key={c.hex} onClick={() => { setTool("pen"); setPenColor(c.hex); }}
          style={{ width:24, height:24, borderRadius:"50%", flexShrink:0, background:c.hex, cursor:"pointer", border:tool==="pen"&&penColor===c.hex?"3px solid #fff":"1.5px solid rgba(255,255,255,0.25)" }} />
      ))}
      {sep}

      {/* Arrow (straight) */}
      <button onClick={() => setTool("arrow")} style={{ ...tb(tool==="arrow", penColor), width:34, fontSize:16 }} title="Rak pil (löpning)">↗</button>

      {/* Curved arrow for running paths */}
      <button onClick={() => setTool("run")}
        style={{ ...tb(tool==="run", penColor), padding:"0 7px", gap:3, fontSize:12, fontWeight:600 }}
        title="Böjd löpningspil">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{flexShrink:0}}>
          <path d="M2 14 Q5 2 14 5" stroke={tool==="run" ? penColor : "#4a5568"} strokeWidth="2" strokeLinecap="round" fill="none"/>
          <polygon points="14,5 10,3 13,8" fill={tool==="run" ? penColor : "#4a5568"}/>
        </svg>
      </button>

      {/* Dashed line for passes */}
      <button onClick={() => setTool("pass")}
        style={{ ...tb(tool==="pass", penColor), padding:"0 7px", gap:3, fontSize:12 }}
        title="Streckad passlinje">
        <svg width="22" height="10" viewBox="0 0 22 10" fill="none" style={{flexShrink:0}}>
          <line x1="1" y1="5" x2="5" y2="5" stroke={tool==="pass" ? penColor : "#4a5568"} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="8" y1="5" x2="12" y2="5" stroke={tool==="pass" ? penColor : "#4a5568"} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="15" y1="5" x2="21" y2="5" stroke={tool==="pass" ? penColor : "#4a5568"} strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>
      {sep}

      {/* Eraser */}
      <button onClick={() => setTool("eraser")} style={{ ...tb(tool==="eraser"), width:34, fontSize:16 }}>⌫</button>
      {sep}

      {/* Player color dots */}
      {PLAYER_COLS.map(c => (
        <button key={c.hex} onClick={() => { setTool("player"); setPlayerColor(c.hex); }}
          style={{ width:14, height:14, borderRadius:"50%", flexShrink:0, background:c.hex, cursor:"pointer", border:playerColor===c.hex?"2.5px solid #fff":"1.5px solid rgba(255,255,255,0.2)" }} />
      ))}

      {/* Player number tokens */}
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button key={n} onClick={() => { setTool("player"); setPlayerNum(n); }}
          style={{ ...tb(tool==="player"&&playerNum===n,playerColor), width:28, height:28, borderRadius:"50%", padding:0, fontSize:11, fontWeight:800,
            background:tool==="player"&&playerNum===n?playerColor:"rgba(255,255,255,0.04)",
            border:"1.5px solid "+(tool==="player"&&playerNum===n?playerColor:"rgba(255,255,255,0.1)"),
            color:tool==="player"&&playerNum===n?"#fff":"#4a5568" }}>
          {n}
        </button>
      ))}
      {sep}

      {/* Cone */}
      <button onClick={() => setTool("cone")} style={{ ...tb(tool==="cone","#f97316"), width:34, fontSize:18 }} title="Kon">🔺</button>

      {/* Ball */}
      <button onClick={() => setTool("ball")}
        style={{ ...tb(tool==="ball","#fbbf24"), width:34, height:34, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}
        title="Innebandyboll">
        <div style={{ width:18, height:18, borderRadius:"50%",
          background: tool==="ball"
            ? "radial-gradient(circle at 35% 35%, #fff 0%, #f0e68c 50%, #daa520 100%)"
            : "radial-gradient(circle at 35% 35%, #aaa 0%, #666 100%)",
          border:"1.5px solid rgba(0,0,0,0.3)",
          boxShadow:"0 1px 3px rgba(0,0,0,0.4)"
        }} />
      </button>
      {sep}

      {/* Undo / Clear — Rensa har två-stegs-bekräftelse (destruktiv, tokens går ej att ångra) */}
      <button onClick={undo}  style={{ ...tb(false), width:34, fontSize:15 }} title="Ångra senaste streck">↩</button>
      <button onClick={handleClearClick}
        style={{ ...tb(false),
          width: confirmClear ? "auto" : 34, padding: confirmClear ? "0 10px" : 0,
          gap: 5, fontSize: confirmClear ? 12 : 14, fontWeight: confirmClear ? 800 : 400,
          background: confirmClear ? "rgba(248,113,113,0.22)" : "transparent",
          border: "1.5px solid " + (confirmClear ? "#f87171" : "rgba(255,255,255,0.1)"),
          color: "#f87171" }}
        title={confirmClear ? "Tryck igen för att rensa hela tavlan" : "Rensa tavlan (streck + tokens)"}
        aria-label={confirmClear ? "Bekräfta: rensa hela tavlan" : "Rensa tavlan"}>
        {confirmClear ? "🗑 Säker?" : "🗑"}
      </button>
      {sep}

      {/* Fullscreen */}
      <button onClick={() => setFullscreen(f => !f)} style={{ ...tb(fullscreen,"#a78bfa"), width:34, fontSize:15 }} title={fullscreen?"Stäng helskärm":"Helskärm"}>
        {fullscreen?"✕":"⛶"}
      </button>

      {/* Spara / Dela — alltid synlig, Share API med download-fallback */}
      {sep}
      <button onClick={handleSparaDela}
        style={{ ...tb(false,"#22c55e"), padding:"0 12px", background:"rgba(34,197,94,0.15)", border:"1.5px solid rgba(34,197,94,0.5)", color:"#22c55e", fontWeight:800, fontSize:13 }}
        title="Dela via WhatsApp/iMessage eller ladda ned som PNG">
        📤 Spara / Dela
      </button>

      {/* Save callback (används när tavlan är inbäddad i annan kontext) */}
      {onSave && (<>
        {sep}
        <button onClick={() => { const d = exportDrawing(); if (d) onSave(d); }}
          style={{ ...tb(false,"#22c55e"), padding:"0 12px", background:"rgba(34,197,94,0.15)", border:"1.5px solid rgba(34,197,94,0.5)", color:"#22c55e", fontWeight:800, fontSize:13 }}>
          💾 Spara
        </button>
        {onCancel && <button onClick={onCancel} style={{ ...tb(false), padding:"0 10px", color:"#f87171", border:"1.5px solid rgba(248,113,113,0.3)" }}>Avbryt</button>}
      </>)}
    </div>
  );

  /* ── Board JSX (inline, not component) ── */
  const boardJSX = (
    <div ref={wrapperRef} style={{ flex:1, position:"relative", overflow:"hidden", touchAction:"none" }}>
      <canvas ref={canvasRef}
        style={{ position:"absolute", inset:0, width:"100%", height:"100%", display:"block", touchAction:"none",
          cursor: tool==="select" ? "default" : (tool==="player"||tool==="cone"||tool==="ball") ? "cell" : "crosshair",
        }}
        onPointerDown={onCanvasDown} onPointerMove={onCanvasMove}
        onPointerUp={onCanvasUp} onPointerCancel={onCanvasUp} onPointerLeave={onCanvasUp} />
      <TokenOverlay tokens={tokens} tool={tool} onTokenDown={onTokenDown} onTokenMove={onTokenMove} onTokenUp={onTokenUp} onTokenDelete={onTokenDelete} />
    </div>
  );

  /* ── Status bar JSX ── */
  const statusJSX = (
    <div style={{ padding:"4px 8px", fontSize:10, color:"#2a5498", textAlign:"center", flexShrink:0, background:"#0d1117" }}>
      {tool==="player" ? `Placerar spelare ${playerNum} — tryck = ny, dra befintlig = flytta`
       : tool==="cone"   ? "Tryck = ny kon — byter till Flytta direkt"
       : tool==="ball"   ? "Tryck = ny boll — byter till Flytta direkt"
       : tool==="select" ? "↖ Flytta-läge: dra tokens, tryck × för att radera"
       : tool==="arrow"  ? "Dra för rak löpningspil"
       : tool==="run"    ? "Dra för böjd löpningspil (kurvar automatiskt)"
       : tool==="pass"   ? "Dra för streckad passlinje"
       : "Hårdare tryck = tjockare linje (Apple Pencil)"}
    </div>
  );

  /* ── Fullscreen ── */
  if (fullscreen) {
    const fsStyle = isPortrait
      ? { position:"fixed", width:"100vh", height:"100vw", top:"50%", left:"50%", transform:"translate(-50%,-50%) rotate(90deg)", transformOrigin:"center center", zIndex:999, background:"#0d1117", display:"flex", flexDirection:"column" }
      : { position:"fixed", inset:0, zIndex:999, background:"#0d1117", display:"flex", flexDirection:"column" };
    return <div style={fsStyle}>{toolbarJSX(true)}{boardJSX}{statusJSX}</div>;
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 128px)", background:"#0d1117" }}>
      {toolbarJSX(false)}{boardJSX}{statusJSX}
    </div>
  );
}
