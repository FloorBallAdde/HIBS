/**
 * TaktiktavlaTab — Officiell innebandyplan (IFF-standard).
 * Verktyg: penna, pil, sudd, ångra, rensa
 *          + spelare 1–10 (röd/blå) + koner (stora) + innebandyboll
 * Tokens (spelare/kon/boll) är rörliga overlay-element — streck & pilar stannar på canvasen.
 * Apple Pencil-stöd via Pointer Events med tryckkänslighet.
 */
import { useRef, useState, useEffect, useCallback } from "react";

/* ─────────── Rink ─────────── */
function drawRink(ctx, W, H) {
  const m = 14, rw = W - m * 2, rh = H - m * 2;
  ctx.fillStyle = "#1a4a8a"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#1e55a0"; ctx.fillRect(m, m, rw, rh);
  const line = (w, a = 1) => { ctx.lineWidth = w; ctx.strokeStyle = `rgba(255,255,255,${a})`; };
  line(2.5); ctx.strokeRect(m, m, rw, rh);
  ctx.strokeStyle = "rgba(220,40,40,0.85)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W/2, m); ctx.lineTo(W/2, m+rh); ctx.stroke();
  line(1.8, 0.75);
  ctx.beginPath(); ctx.arc(W/2, H/2, rw*0.09, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath(); ctx.arc(W/2, H/2, 3, 0, Math.PI*2); ctx.fill();
  const gaW = rw*0.125, gaH = rh*0.375, gaY = m+(rh-gaH)/2;
  line(1.5, 0.8); ctx.strokeRect(m, gaY, gaW, gaH); ctx.strokeRect(m+rw-gaW, gaY, gaW, gaH);
  const kkW = gaW*0.42, kkH = gaH*0.46, kkY = m+(rh-kkH)/2;
  line(1, 0.45); ctx.strokeRect(m, kkY, kkW, kkH); ctx.strokeRect(m+rw-kkW, kkY, kkW, kkH);
  const netH = rh*0.13, netW = 5, netY = H/2 - netH/2;
  ctx.fillStyle = "rgba(255,255,255,0.09)";
  ctx.fillRect(m-netW, netY, netW, netH); ctx.fillRect(m+rw, netY, netW, netH);
  line(1.5, 0.7); ctx.strokeRect(m-netW, netY, netW, netH); ctx.strokeRect(m+rw, netY, netW, netH);
  const fpX = rw*0.22, fpY = rh*0.075;
  [[m+fpX,m+fpY],[m+fpX,m+rh-fpY],[m+rw-fpX,m+fpY],[m+rw-fpX,m+rh-fpY]].forEach(([x,y]) => {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
  });
}

/* ─────────── Arrow helper ─────────── */
function drawArrow(ctx, x1, y1, x2, y2, color, lw) {
  const dx = x2-x1, dy = y2-y1;
  const len = Math.sqrt(dx*dx+dy*dy);
  if (len < 4) return;
  const angle = Math.atan2(dy, dx);
  const head = Math.max(12, lw * 5);
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
  // shaft (stop before arrowhead)
  const stopX = x2 - Math.cos(angle) * head * 0.6;
  const stopY = y2 - Math.sin(angle) * head * 0.6;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(stopX, stopY); ctx.stroke();
  // arrowhead
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head*Math.cos(angle-Math.PI/6), y2 - head*Math.sin(angle-Math.PI/6));
  ctx.lineTo(x2 - head*Math.cos(angle+Math.PI/6), y2 - head*Math.sin(angle+Math.PI/6));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

const PEN_COLORS  = [{ hex: "#ffffff" }, { hex: "#ef4444" }, { hex: "#fbbf24" }, { hex: "#22c55e" }];
const PEN_SIZES   = [2, 4, 7];
const PLAYER_COLS = [{ hex: "#ef4444", label: "Röd" }, { hex: "#38bdf8", label: "Blå" }];

/* ─────────── Token overlay ─────────── */
function TokenOverlay({ tokens, tool, onTokenDown, onTokenMove, onTokenUp, onTokenDelete }) {
  // In select mode or placement modes: tokens are interactive (draggable)
  const isInteractive = tool === "player" || tool === "cone" || tool === "ball" || tool === "select";
  const showDelete    = tool === "select"; // show × badge in select mode

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {tokens.map(tok => {
        const base = {
          position: "absolute",
          left: `${tok.xF * 100}%`, top: `${tok.yF * 100}%`,
          transform: "translate(-50%, -50%)",
          touchAction: "none", userSelect: "none",
          pointerEvents: isInteractive ? "auto" : "none",
          cursor: isInteractive ? "grab" : "default",
          zIndex: 10,
        };
        const handlers = {
          onPointerDown: e => onTokenDown(e, tok.id),
          onPointerMove: onTokenMove,
          onPointerUp: onTokenUp,
          onPointerCancel: onTokenUp,
        };

        // Small red × badge shown in select mode
        const deleteBadge = showDelete && (
          <div
            onPointerDown={e => { e.stopPropagation(); onTokenDelete(tok.id); }}
            style={{
              position: "absolute", top: -8, right: -8,
              width: 18, height: 18, borderRadius: "50%",
              background: "#ef4444", border: "1.5px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: "#fff",
              cursor: "pointer", zIndex: 20, pointerEvents: "auto",
              lineHeight: 1,
            }}>×</div>
        );

        if (tok.type === "player") {
          return (
            <div key={tok.id} {...handlers} style={{
              ...base, width: 30, height: 30, borderRadius: "50%",
              background: tok.color, border: "2.5px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: tok.num > 9 ? 10 : 12, fontWeight: 900, color: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
            }}>
              {tok.num}{deleteBadge}
            </div>
          );
        }
        if (tok.type === "cone") {
          return (
            <div key={tok.id} {...handlers} style={{
              ...base, width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
            }}>🔺{deleteBadge}</div>
          );
        }
        if (tok.type === "ball") {
          return (
            <div key={tok.id} {...handlers} style={{
              ...base, width: 28, height: 28, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #fff 0%, #f0e68c 50%, #daa520 100%)",
              border: "2px solid rgba(0,0,0,0.3)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(0,0,0,0.15)",
            }}>{deleteBadge}</div>
          );
        }
        return null;
      })}
    </div>
  );
}

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

  const [tool,        setTool]        = useState("pen");
  const [penColor,    setPenColor]    = useState("#ffffff");
  const [penSize,     setPenSize]     = useState(3);
  const [playerNum,   setPlayerNum]   = useState(1);
  const [playerColor, setPlayerColor] = useState("#ef4444");
  const [tokens,      setTokens]      = useState([]);
  const [fullscreen,  setFullscreen]  = useState(false);

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
      if (tool === "player") setPlayerNum(n => n >= 10 ? 1 : n + 1);
      return;
    }

    snap();

    if (tool === "arrow") {
      const pt = getCanvasPos(e);
      arrowStart.current = pt;
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

    if (tool === "arrow" && arrowStart.current && arrowPreSnap.current) {
      // Restore pre-snap and draw live preview
      ctx.putImageData(arrowPreSnap.current, 0, 0);
      const pt = getCanvasPos(e);
      drawArrow(ctx, arrowStart.current.x, arrowStart.current.y, pt.x, pt.y, penColor, penSize);
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
    if (tool === "arrow" && arrowStart.current && arrowPreSnap.current && isDrawing.current) {
      const c = canvasRef.current; const ctx = c.getContext("2d");
      const pt = getCanvasPos(e);
      ctx.putImageData(arrowPreSnap.current, 0, 0);
      drawArrow(ctx, arrowStart.current.x, arrowStart.current.y, pt.x, pt.y, penColor, penSize);
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
        style={{ ...tb(tool==="select","#a78bfa"), width:34, fontSize:16 }} title="Markera & flytta">
        ↖
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

      {/* Arrow */}
      <button onClick={() => setTool("arrow")} style={{ ...tb(tool==="arrow", penColor), width:34, fontSize:16 }} title="Pil">↗</button>
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

      {/* Undo / Clear */}
      <button onClick={undo}  style={{ ...tb(false), width:34, fontSize:15 }}>↩</button>
      <button onClick={clear} style={{ ...tb(false), width:34, fontSize:14, color:"#f87171" }}>🗑</button>
      {sep}

      {/* Fullscreen */}
      <button onClick={() => setFullscreen(f => !f)} style={{ ...tb(fullscreen,"#a78bfa"), width:34, fontSize:15 }} title={fullscreen?"Stäng helskärm":"Helskärm"}>
        {fullscreen?"✕":"⛶"}
      </button>

      {/* Save (only when onSave prop provided) */}
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
          cursor: tool==="select" ? "default" : (tool==="player"||tool==="cone"||tool==="ball") ? "cell" : "crosshair" }}
        onPointerDown={onCanvasDown} onPointerMove={onCanvasMove}
        onPointerUp={onCanvasUp} onPointerCancel={onCanvasUp} onPointerLeave={onCanvasUp} />
      <TokenOverlay tokens={tokens} tool={tool} onTokenDown={onTokenDown} onTokenMove={onTokenMove} onTokenUp={onTokenUp} onTokenDelete={onTokenDelete} />
    </div>
  );

  /* ── Status bar JSX ── */
  const statusJSX = (
    <div style={{ padding:"4px 8px", fontSize:10, color:"#2a5498", textAlign:"center", flexShrink:0, background:"#0d1117" }}>
      {tool==="player" ? `Placerar spelare ${playerNum} — tryck = ny, dra befintlig = flytta`
       : tool==="cone" ? "Tryck = ny kon, dra befintlig = flytta"
       : tool==="ball" ? "Tryck = ny boll, dra befintlig = flytta"
       : tool==="select" ? "Dra tokens för att flytta — tryck × för att radera"
       : tool==="arrow" ? "Tryck och dra för att rita en pil"
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
