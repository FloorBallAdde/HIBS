/**
 * useTaktiktavlaCanvas — Sprint 56: extraherad från TaktiktavlaTab.jsx.
 * All canvas- och token-logik för taktiktavlan: init/resize, rit-verktyg
 * (penna/pil/böjd pil/passlinje/sudd), undo-stack, två-stegs-rensa,
 * token-placering & drag (spelare/kon/boll), export med tokens inbakade
 * samt Spara/Dela via Share API med download-fallback.
 * TaktiktavlaTab behåller enbart presentation (toolbar/board/status-JSX).
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { drawRink, drawArrow, drawCurvedArrow, drawDashedLine } from "../components/training/rinkDraw";

export function useTaktiktavlaCanvas() {
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

  const undo = useCallback(() => {
    const c = canvasRef.current;
    if (c && undoStack.current.length) c.getContext("2d").putImageData(undoStack.current.pop(), 0, 0);
  }, []);

  const clear = useCallback(() => {
    const c = canvasRef.current;
    if (c && rinkRef.current) { snap(); c.getContext("2d").drawImage(rinkRef.current, 0, 0); setTokens([]); setPlayerNum(1); }
  }, [snap]);

  /* ── Rensa med två-stegs-bekräftelse ──
     Rensa är destruktivt: streck OCH alla utplacerade tokens (spelare/koner/boll)
     försvinner. Undo gäller bara canvasen — tokens går INTE att få tillbaka. Vid
     rinken med kalla händer ska en feltryckning inte radera hela taktikuppställningen.
     Första tryck = väpna (knappen blir röd "🗑 Säker?"), andra tryck inom 3s = rensa.
     Avväpnas automatiskt efter 3s om inget andra tryck kommer. */
  const handleClearClick = useCallback(() => {
    clearTimeout(confirmTimer.current);
    if (confirmClear) {
      setConfirmClear(false);
      clear();
    } else {
      setConfirmClear(true);
      confirmTimer.current = setTimeout(() => setConfirmClear(false), 3000);
    }
  }, [confirmClear, clear]);

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

  return {
    // refs (kopplas i boardJSX)
    canvasRef, wrapperRef,
    // verktygsstate
    tool, setTool, penColor, setPenColor, penSize, setPenSize,
    playerNum, setPlayerNum, playerColor, setPlayerColor,
    tokens, fullscreen, setFullscreen, confirmClear,
    // actions
    undo, handleClearClick, exportDrawing, handleSparaDela,
    // canvas-events
    onCanvasDown, onCanvasMove, onCanvasUp,
    // token-events
    onTokenDown, onTokenMove, onTokenUp, onTokenDelete,
  };
}
