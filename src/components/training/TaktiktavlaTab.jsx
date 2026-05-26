/**
 * TaktiktavlaTab — Officiell innebandyplan (IFF-standard).
 * Verktyg: penna, pil, sudd, ångra, rensa
 *          + spelare 1–10 (röd/blå) + koner (stora) + innebandyboll
 * Tokens (spelare/kon/boll) är rörliga overlay-element — streck & pilar stannar på canvasen.
 * Apple Pencil-stöd via Pointer Events med tryckkänslighet.
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { drawRink, drawArrow, drawCurvedArrow, drawDashedLine } from "./rinkDraw";
import TokenOverlay from "./TokenOverlay";

const PEN_COLORS  = [{ hex: "#ffffff" }, { hex: "#ef4444" }, { hex: "#fbbf24" }, { hex: "#22c55e" }];
const PEN_SIZES   = [2, 4, 7];
const PLAYER_COLS = [{ hex: "#ef4444", label: "Röd" }, { hex: "#38bdf8", label: "Blå" }];

/* ─────────── Main component ─────────── */
export default function TaktiktavlaTab({ onSave = null, onCancel = null }) {
  const canvasRef    = useRef(null);
  const rinkRef      = useRef(null);
  const wrapperRef   = useRef(null);
  const undoStack    = useRef([]);
  const isDrawing    = useRef(false);
  const lastPt       = useRef(null);
  const arrowStart   = useRef(null);
  const arrowPreSnap = useRef(null); // canvas state at arrow-draw start (for live preview)
  const tokenIdRef   = useRef(0);
  const dragState    = useRef(null);
  const resizeTimer  = useRef(null);
  const runPathRef   = useRef([]); // tracks pointer path for bidirectional curved arrows
  const confirmTimer = useRef(null); // auto-avväpning av 🗑-bekräftelsen

  const [tool,        setTool]        = useState("pen");
  const [penColor,    setPenColor]    = useState("#ffffff");
  const [penSize,     setPenSize]     = useState(3);
  const [playerNum,   setPlayerNum]   = useState(1);
  const [playerColor, setPlayerColor] = useState("#ef4444");
  const [tokens,      setTokens]      = useState([]);
  const [fullscreen,  setFullscreen]  = useState(false);
  const [confirmClear, setConfirmClear] = useState(false); // 🗑 två-stegs-bekräftelse

  /* ── Canvas init ── */
  const initCanvas = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const p = c.parentElement;   if (!p) return;
    c.width = p.clientWidth || p.offsetWidth;
    c.height = p.clientHeight || p.offsetHeight;
    const rink = document.createElement("canvas");
    rink.width = c.width; rink.height = c.height;
    drawRink(rink.getContext("2d"), rink.width, rink.height);
    rinkRef.current = rink;
    c.getContext("2d").drawImage(rink, 0, 0);
    undoStack.current = [];
  }, []);

  useEffect(() => {
    const t = setTimeout(initCanvas, 60);
    const onResize = () => { clearTimeout(resizeTimer.current); resizeTimer.current = setTimeout(initCanvas, 120); };
    window.addEventListener("resize", onResize);
    screen.orientation?.addEventListener?.("change", onResize);
    return () => { clearTimeout(t); clearTimeout(resizeTimer.current); window.removeEventListener("resize", onResize); screen.orientation?.removeEventListener?.("change", onResize); };
  }, [initCanvas]);

  useEffect(() => { const t = setTimeout(initCanvas, 80); return () => clearTimeout(t); }, [fullscreen, initCanvas]);

  /* ── Helpers ── */
  const snap = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const s = c.getContext("2d").getImageData(0, 0, c.width, c.height);
    undoStack.current.push(s);
    if (undoStack.current.length > 40) undoStack.current.shift();
  }, []);

  const undo = () => {
    const c = canvasRef.current;
    if (c && undoStack.current.length) c.getContext("2d").putImageData(undoStack.current.pop(), 0, 0);
  };

  const clear = () => {
    const c = canvasRef.current;
    if (c && rinkRef.current) { snap(); c.getContext("2d").drawImage(rinkRef.current, 0, 0); setTokens([]); setPlayerNum(1); }
  };

  /* ── Rensa med två-stegs-bekräftelse ──
     Rensa är destruktivt: streck OCH alla utplacerade tokens (spelare/koner/boll)
     försvinner. Undo gäller bara canvasen — tokens går INTE att få tillbaka. Vid
     rinken med kalla händer ska en feltryckning inte radera hela taktikuppställningen.
     Första tryck = väpna (knappen blir röd "🗑 Säker?"), andra tryck inom 3s = rensa.
     Avväpnas automatiskt efter 3s om inget andra tryck kommer. */
  const handleClearClick = () => {
    clearTimeout(confirmTimer.current);
    if (confirmClear) {
      setConfirmClear(false);
      clear();
    } else {
      setConfirmClear(true);
      confirmTimer.current = setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  /* ── Export with tokens baked in ── */
  const exportDrawing = useCallback(() => {
    const c = canvasRef.current; if (!c) return null;
    const tmp = document.createElement("canvas");
    tmp.width = c.width; tmp.height = c.height;
    const tCtx = tmp.getContext("2d");
    tCtx.drawImage(c, 0, 0);
    tokens.forEach(tok => {
      const px = tok.xF * c.width, py = tok.yF * c.height;
      if (tok.type === "player") {
        tCtx.save();
        tCtx.fillStyle = tok.color; tCtx.strokeStyle = "#fff"; tCtx.lineWidth = 2;
        tCtx.beginPath(); tCtx.arc(px, py, 14, 0, Math.PI*2); tCtx.fill(); tCtx.stroke();
        tCtx.fillStyle = "#fff"; tCtx.font = `bold ${tok.num>9?11:13}px system-ui`;
        tCtx.textAlign = "center"; tCtx.textBaseline = "middle";
        tCtx.fillText(String(tok.num), px, py); tCtx.restore();
      } else if (tok.type === "cone") {
        tCtx.save();
        tCtx.fillStyle = "#f97316"; tCtx.strokeStyle = "#fff"; tCtx.lineWidth = 1.5;
        tCtx.beginPath(); tCtx.moveTo(px, py-16); tCtx.lineTo(px+13, py+10); tCtx.lineTo(px-13, py+10);
        tCtx.closePath(); tCtx.fill(); tCtx.stroke(); tCtx.restore();
      } else if (tok.type === "ball") {
        tCtx.save();
        const grd = tCtx.createRadialGradient(px-4, py-4, 2, px, py, 12);
        grd.addColorStop(0, "#fff"); grd.addColorStop(0.5, "#f0e68c"); grd.addColorStop(1, "#daa520");
        tCtx.fillStyle = grd; tCtx.strokeStyle = "rgba(0,0,0,0.3)"; tCtx.lineWidth = 1.5;
        tCtx.beginPath(); tCtx.arc(px, py, 12, 0, Math.PI*2); tCtx.fill(); tCtx.stroke(); tCtx.restore();
      }
    });
    return tmp.toDataURL("image/png");
  }, [tokens]);

  /* ── Spara / Dela: Share API med download-fallback ── */
  const handleSparaDela = useCallback(async () => {
    const dataUrl = exportDrawing();
    if (!dataUrl) return;
    const ts = new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-");
    const filename = `HIBS_taktiktavla_${ts}.png`;
    // Försök Share API (iOS/Android)
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: "HIBS Taktiktavla", files: [file] });
          return;
        }
      } catch (err) {
        if (err.name === "AbortError") return; // Användaren avbröt — gör inget
        // Annan error → fallback till download
      }
    }
    // Fallback: ladda ned som PNG
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }, [exportDrawing]);

  const getCanvasPos = (e) => {
    const c = canvasRef.current, r = c.getBoundingClientRect();
    return { x: (e.clientX-r.left)*(c.width/r.width), y: (e.clientY-r.top)*(c.height/r.height) };
  };

  const getWrapperFraction = (e) => {
    const w = wrapperRef.current; if (!w) return { xF:0, yF:0 };
    const r = w.getBoundingClientRect();
    return { xF: Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)), yF: Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)) };
  };

  /* ── Canvas pointer events ── */
  const onCanvasDown = useCallback((e) => {
    e.preventDefault();

    // Select mode: only dragging via token handlers, canvas tap does nothing
    if (tool === "select") return;

    // Place tokens
    if (tool === "player" || tool === "cone" || tool === "ball") {
      const { xF, yF } = getWrapperFraction(e);
      const newTok = { id: ++tokenIdRef.current, type: tool, num: tool==="player" ? playerNum : undefined, color: tool==="player" ? playerColor : undefined, xF, yF };
      setTokens(prev => [...prev, newTok]);
      if (tool === "player") {
        setPlayerNum(n => n >= 10 ? 1 : n + 1);
      } else {
        // After placing a cone or ball → auto-switch to select so user can drag it right away
        setTool("select");
      }
      return;
    }

    snap();

    // Two-point tools: arrow, run (curved arrow), pass (dashed line)
    if (tool === "arrow" || tool === "run" || tool === "pass") {
      const pt = getCanvasPos(e);
      arrowStart.current = pt;
      if (tool === "run") runPathRef.current = [];
      arrowPreSnap.current = canvasRef.current.getContext("2d").getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      isDrawing.current = true;
      canvasRef.current?.setPointerCapture?.(e.pointerId);
      return;
    }

    isDrawing.current = true;
    lastPt.current = getCanvasPos(e);
    canvasRef.current?.setPointerCapture?.(e.pointerId);
  }, [tool, playerNum, playerColor, snap]); // eslint-disable-line

  const onCanvasMove = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const c = canvasRef.current;
    const ctx = c.getContext("2d");

    if ((tool === "arrow" || tool === "run" || tool === "pass") && arrowStart.current && arrowPreSnap.current) {
      ctx.putImageData(arrowPreSnap.current, 0, 0);
      const pt = getCanvasPos(e);
      if (tool === "run") {
        // Collect pointer path every ~5px to track arc direction
        const path = runPathRef.current;
        const last = path[path.length - 1];
        const dx = last ? pt.x - last.x : 999, dy = last ? pt.y - last.y : 999;
        if (!last || dx*dx + dy*dy > 25) path.push({x: pt.x, y: pt.y});
        drawCurvedArrow(ctx, arrowStart.current.x, arrowStart.current.y, pt.x, pt.y, penColor, penSize, path, c.width, c.height);
      } else if (tool === "arrow") {
        drawArrow(ctx, arrowStart.current.x, arrowStart.current.y, pt.x, pt.y, penColor, penSize);
      } else if (tool === "pass") {
        drawDashedLine(ctx, arrowStart.current.x, arrowStart.current.y, pt.x, pt.y, penColor, penSize);
      }
      return;
    }

    if (!lastPt.current) return;
    const pt = getCanvasPos(e);
    ctx.save();
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)"; ctx.lineWidth = penSize * 6;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize * (0.4 + (e.pressure > 0 ? e.pressure : 1) * 0.9);
    }
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(lastPt.current.x, lastPt.current.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();
    ctx.restore();
    if (tool === "eraser") {
      ctx.save(); ctx.globalCompositeOperation = "destination-over"; ctx.drawImage(rinkRef.current, 0, 0); ctx.restore();
    }
    lastPt.current = pt;
  }, [tool, penColor, penSize]);

  const onCanvasUp = useCallback((e) => {
    e.preventDefault();
    if ((tool === "arrow" || tool === "run" || tool === "pass") && arrowStart.current && arrowPreSnap.current && isDrawing.current) {
      const c = canvasRef.current; const ctx = c.getContext("2d");
      const pt = getCanvasPos(e);
      ctx.putImageData(arrowPreSnap.current, 0, 0);
      if (tool === "arrow") drawArrow(ctx, arrowStart.current.x, arrowStart.current.y, pt.x, pt.y, penColor, penSize);
      else if (tool === "run")  drawCurvedArrow(ctx, arrowStart.current.x, arrowStart.current.y, pt.x, pt.y, penColor, penSize, runPathRef.current, c.width, c.height);
      else if (tool === "pass") drawDashedLine(ctx, arrowStart.current.x, arrowStart.current.y, pt.x, pt.y, penColor, penSize);
    }
    isDrawing.current = false; lastPt.current = null; arrowStart.current = null; arrowPreSnap.current = null;
  }, [tool, penColor, penSize]); // eslint-disable-line

  /* ── Token drag ── */
  const onTokenDown = useCallback((e, tokenId) => {
    if (tool !== "player" && tool !== "cone" && tool !== "ball" && tool !== "select") return;
    e.stopPropagation(); e.preventDefault();
    const { xF, yF } = getWrapperFraction(e);
    const tok = tokens.find(t => t.id === tokenId); if (!tok) return;
    dragState.current = { id: tokenId, startXF: xF, startYF: yF, origXF: tok.xF, origYF: tok.yF };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [tool, tokens]); // eslint-disable-line

  const onTokenMove = useCallback((e) => {
    if (!dragState.current) return;
    e.preventDefault();
    const { xF, yF } = getWrapperFraction(e);
    const ds = dragState.current;
    setTokens(prev => prev.map(t =>
      t.id === ds.id
        ? { ...t, xF: Math.max(0.01, Math.min(0.99, ds.origXF+(xF-ds.startXF))), yF: Math.max(0.01, Math.min(0.99, ds.origYF+(yF-ds.startYF))) }
        : t
    ));
  }, []); // eslint-disable-line

  const onTokenUp = useCallback((e) => { e.preventDefault(); dragState.current = null; }, []);

  const onTokenDelete = useCallback((tokenId) => {
    setTokens(prev => prev.filter(t => t.id !== tokenId));
  }, []);

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
