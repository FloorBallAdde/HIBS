/**
 * TaktiktavlaTab — Officiell innebandyplan (IFF-standard).
 * Blå yta, vita linjer, rektangulära målområden.
 * Verktyg: penna, sudd, ångra, rensa + spelare 1–10 (röd/blå) + koner.
 *
 * Förbättringar:
 * - Spelare/koner är rörliga overlay-element (drag utan att streck påverkas)
 * - Auto-increment: placera spelare 1 → nästa är 2 automatiskt
 * - Helskärmsläge med landscape-rotation på mobil (Apple Pencil-optimerat)
 * - Apple Pencil-stöd via Pointer Events API med tryckkänslighet
 */
import { useRef, useState, useEffect, useCallback } from "react";

/* ─────────── Rink ─────────── */
function drawRink(ctx, W, H) {
  const m = 14;
  const rw = W - m * 2;
  const rh = H - m * 2;

  ctx.fillStyle = "#1a4a8a";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#1e55a0";
  ctx.fillRect(m, m, rw, rh);

  const line = (w, a = 1) => { ctx.lineWidth = w; ctx.strokeStyle = `rgba(255,255,255,${a})`; };

  line(2.5); ctx.strokeRect(m, m, rw, rh);

  ctx.strokeStyle = "rgba(220,40,40,0.85)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2, m); ctx.lineTo(W / 2, m + rh); ctx.stroke();

  line(1.8, 0.75);
  ctx.beginPath(); ctx.arc(W / 2, H / 2, rw * 0.09, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 3, 0, Math.PI * 2); ctx.fill();

  const gaW = rw * 0.125; const gaH = rh * 0.375;
  const gaY = m + (rh - gaH) / 2;
  line(1.5, 0.8);
  ctx.strokeRect(m, gaY, gaW, gaH);
  ctx.strokeRect(m + rw - gaW, gaY, gaW, gaH);

  const kkW = gaW * 0.42; const kkH = gaH * 0.46;
  const kkY = m + (rh - kkH) / 2;
  line(1, 0.45);
  ctx.strokeRect(m, kkY, kkW, kkH);
  ctx.strokeRect(m + rw - kkW, kkY, kkW, kkH);

  const netH = rh * 0.13; const netW = 5;
  const netY = H / 2 - netH / 2;
  ctx.fillStyle = "rgba(255,255,255,0.09)";
  ctx.fillRect(m - netW, netY, netW, netH);
  ctx.fillRect(m + rw, netY, netW, netH);
  line(1.5, 0.7);
  ctx.strokeRect(m - netW, netY, netW, netH);
  ctx.strokeRect(m + rw, netY, netW, netH);

  const fpX = rw * 0.22; const fpY = rh * 0.075;
  [[m + fpX, m + fpY], [m + fpX, m + rh - fpY],
   [m + rw - fpX, m + fpY], [m + rw - fpX, m + rh - fpY]].forEach(([x, y]) => {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  });
}

const PEN_COLORS = [
  { hex: "#ffffff" }, { hex: "#ef4444" }, { hex: "#fbbf24" }, { hex: "#22c55e" },
];
const PEN_SIZES = [2, 4, 7];
const PLAYER_COLS = [{ hex: "#ef4444", label: "Röd" }, { hex: "#38bdf8", label: "Blå" }];

/* ─────────── Token overlay ─────────── */
function TokenOverlay({ tokens, tool, onTokenDown, onTokenMove, onTokenUp }) {
  const isInteractive = tool === "player" || tool === "cone";
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {tokens.map(tok => {
        const base = {
          position: "absolute",
          left: `${tok.xF * 100}%`,
          top:  `${tok.yF * 100}%`,
          transform: "translate(-50%, -50%)",
          touchAction: "none",
          userSelect: "none",
          pointerEvents: isInteractive ? "auto" : "none",
          cursor: isInteractive ? "grab" : "default",
          zIndex: 10,
        };
        if (tok.type === "player") {
          return (
            <div key={tok.id}
              style={{
                ...base,
                width: 30, height: 30,
                borderRadius: "50%",
                background: tok.color,
                border: "2.5px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: tok.num > 9 ? 10 : 12,
                fontWeight: 900, color: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
              }}
              onPointerDown={e => onTokenDown(e, tok.id)}
              onPointerMove={onTokenMove}
              onPointerUp={onTokenUp}
              onPointerCancel={onTokenUp}
            >{tok.num}</div>
          );
        }
        if (tok.type === "cone") {
          return (
            <div key={tok.id}
              style={{
                ...base,
                width: 26, height: 26,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.5))",
              }}
              onPointerDown={e => onTokenDown(e, tok.id)}
              onPointerMove={onTokenMove}
              onPointerUp={onTokenUp}
              onPointerCancel={onTokenUp}
            >🔺</div>
          );
        }
        return null;
      })}
    </div>
  );
}

/* ─────────── Main component ─────────── */
// onSave(dataURL) — optional. When provided, a "Spara" button appears in toolbar.
export default function TaktiktavlaTab({ onSave = null, onCancel = null }) {
  const canvasRef   = useRef(null);
  const rinkRef     = useRef(null);
  const wrapperRef  = useRef(null);
  const undoStack   = useRef([]);
  const isDrawing   = useRef(false);
  const lastPt      = useRef(null);
  const tokenIdRef  = useRef(0);
  const dragState   = useRef(null); // { id, startXF, startYF, origXF, origYF }
  const resizeTimer = useRef(null);

  const [tool,        setTool]        = useState("pen");
  const [penColor,    setPenColor]    = useState("#ffffff");
  const [penSize,     setPenSize]     = useState(3);
  const [playerNum,   setPlayerNum]   = useState(1);
  const [playerColor, setPlayerColor] = useState("#ef4444");
  const [tokens,      setTokens]      = useState([]);
  const [fullscreen,  setFullscreen]  = useState(false);

  /* ── Canvas init ── */
  const initCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const p = c.parentElement;
    if (!p) return;
    // Force layout flush before measuring
    c.width  = p.clientWidth  || p.offsetWidth;
    c.height = p.clientHeight || p.offsetHeight;
    const rink = document.createElement("canvas");
    rink.width = c.width; rink.height = c.height;
    drawRink(rink.getContext("2d"), rink.width, rink.height);
    rinkRef.current = rink;
    c.getContext("2d").drawImage(rink, 0, 0);
    undoStack.current = [];
  }, []);

  useEffect(() => {
    // Small delay on mount so DOM has settled
    const t = setTimeout(initCanvas, 60);
    const onResize = () => {
      clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(initCanvas, 120);
    };
    window.addEventListener("resize", onResize);
    screen.orientation?.addEventListener?.("change", onResize);
    return () => {
      clearTimeout(t);
      clearTimeout(resizeTimer.current);
      window.removeEventListener("resize", onResize);
      screen.orientation?.removeEventListener?.("change", onResize);
    };
  }, [initCanvas]);

  // Re-init when fullscreen mode toggles (dimensions change)
  useEffect(() => {
    const t = setTimeout(initCanvas, 80);
    return () => clearTimeout(t);
  }, [fullscreen, initCanvas]);

  /* ── Helpers ── */
  const snap = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
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
    if (c && rinkRef.current) {
      snap();
      c.getContext("2d").drawImage(rinkRef.current, 0, 0);
      setTokens([]);
      setPlayerNum(1);
    }
  };

  // Export canvas + tokens as a single PNG
  const exportDrawing = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return null;
    // Composite tokens onto a temp canvas
    const tmp = document.createElement("canvas");
    tmp.width = c.width; tmp.height = c.height;
    const tCtx = tmp.getContext("2d");
    tCtx.drawImage(c, 0, 0);
    // Draw each token onto the export canvas
    tokens.forEach(tok => {
      const px = tok.xF * c.width;
      const py = tok.yF * c.height;
      if (tok.type === "player") {
        const r = 14;
        tCtx.save();
        tCtx.fillStyle = tok.color;
        tCtx.strokeStyle = "#fff"; tCtx.lineWidth = 2;
        tCtx.beginPath(); tCtx.arc(px, py, r, 0, Math.PI * 2); tCtx.fill(); tCtx.stroke();
        tCtx.fillStyle = "#fff";
        tCtx.font = `bold ${tok.num > 9 ? 11 : 13}px system-ui`;
        tCtx.textAlign = "center"; tCtx.textBaseline = "middle";
        tCtx.fillText(String(tok.num), px, py);
        tCtx.restore();
      } else if (tok.type === "cone") {
        tCtx.save();
        tCtx.fillStyle = "#f97316"; tCtx.strokeStyle = "#fff"; tCtx.lineWidth = 1.2;
        tCtx.beginPath();
        tCtx.moveTo(px, py - 11); tCtx.lineTo(px + 9, py + 7); tCtx.lineTo(px - 9, py + 7);
        tCtx.closePath(); tCtx.fill(); tCtx.stroke();
        tCtx.restore();
      }
    });
    return tmp.toDataURL("image/png");
  }, [tokens]);

  const getCanvasPos = (e) => {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (c.width  / r.width),
      y: (e.clientY - r.top)  * (c.height / r.height),
    };
  };

  const getWrapperFraction = (e) => {
    const w = wrapperRef.current;
    if (!w) return { xF: 0, yF: 0 };
    const r = w.getBoundingClientRect();
    return {
      xF: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      yF: Math.max(0, Math.min(1, (e.clientY - r.top)  / r.height)),
    };
  };

  /* ── Canvas pointer events ── */
  const onCanvasDown = useCallback((e) => {
    e.preventDefault();

    if (tool === "player" || tool === "cone") {
      // Place new token at tapped position
      const { xF, yF } = getWrapperFraction(e);
      const newTok = {
        id:    ++tokenIdRef.current,
        type:  tool,
        num:   tool === "player" ? playerNum : undefined,
        color: tool === "player" ? playerColor : "#f97316",
        xF, yF,
      };
      setTokens(prev => [...prev, newTok]);
      if (tool === "player") {
        // Auto-increment: after placing 10 wrap back to 1
        setPlayerNum(n => n >= 10 ? 1 : n + 1);
      }
      return;
    }

    snap();
    isDrawing.current = true;
    lastPt.current = getCanvasPos(e);
    canvasRef.current?.setPointerCapture?.(e.pointerId);
  }, [tool, playerNum, playerColor, snap]); // eslint-disable-line

  const onCanvasMove = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current || !lastPt.current) return;
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    const pt  = getCanvasPos(e);

    ctx.save();
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth   = penSize * 6;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = penColor;
      ctx.lineWidth   = penSize * (0.4 + (e.pressure > 0 ? e.pressure : 1) * 0.9);
    }
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPt.current.x, lastPt.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();

    if (tool === "eraser") {
      const t2 = c.getContext("2d");
      t2.save();
      t2.globalCompositeOperation = "destination-over";
      t2.drawImage(rinkRef.current, 0, 0);
      t2.restore();
    }
    lastPt.current = pt;
  }, [tool, penColor, penSize]);

  const onCanvasUp = useCallback((e) => {
    e.preventDefault();
    isDrawing.current = false;
    lastPt.current    = null;
  }, []);

  /* ── Token drag events ── */
  const onTokenDown = useCallback((e, tokenId) => {
    if (tool !== "player" && tool !== "cone") return;
    e.stopPropagation();
    e.preventDefault();
    const { xF, yF } = getWrapperFraction(e);
    const tok = tokens.find(t => t.id === tokenId);
    if (!tok) return;
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
        ? { ...t, xF: Math.max(0.01, Math.min(0.99, ds.origXF + (xF - ds.startXF))),
                  yF: Math.max(0.01, Math.min(0.99, ds.origYF + (yF - ds.startYF))) }
        : t
    ));
  }, []); // eslint-disable-line

  const onTokenUp = useCallback((e) => {
    e.preventDefault();
    dragState.current = null;
  }, []);

  /* ── Portrait/landscape detection ── */
  const isPortrait = typeof window !== "undefined" && window.innerHeight > window.innerWidth;

  /* ── Shared style helpers (stable, no sub-components) ── */
  const tb = (active, accent) => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 9, height: 34,
    border: "1.5px solid " + (active ? (accent || "#fff") : "rgba(255,255,255,0.1)"),
    background: active ? "rgba(255,255,255,0.1)" : "transparent",
    color: active ? "#fff" : "#4a5568",
    cursor: "pointer", fontFamily: "inherit", fontSize: 13,
    flexShrink: 0, padding: "0 7px",
  });
  const sep = <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />;

  /* ── Inline JSX helpers (NOT sub-components — avoids remount-on-render) ── */
  const toolbarJSX = (compact = false) => (
    <div style={{
      display: "flex", alignItems: "center", gap: compact ? 3 : 4,
      padding: compact ? "4px 4px" : "6px 4px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      overflowX: "auto", flexShrink: 0, background: "#0d1117",
    }}>
      {PEN_SIZES.map(s => (
        <button key={s} onClick={() => { setTool("pen"); setPenSize(s); }}
          style={{ ...tb(tool === "pen" && penSize === s), width: 30 }}>
          <div style={{ width: s * 2.8, height: s * 2.8, borderRadius: "50%", background: tool === "pen" && penSize === s ? penColor : "#4a5568" }} />
        </button>
      ))}
      {sep}
      {PEN_COLORS.map(c => (
        <button key={c.hex} onClick={() => { setTool("pen"); setPenColor(c.hex); }}
          style={{
            width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
            background: c.hex, cursor: "pointer",
            border: tool === "pen" && penColor === c.hex ? "3px solid #fff" : "1.5px solid rgba(255,255,255,0.25)",
          }} />
      ))}
      {sep}
      <button onClick={() => setTool("eraser")} style={{ ...tb(tool === "eraser"), width: 34, fontSize: 16 }}>⌫</button>
      {sep}
      {PLAYER_COLS.map(c => (
        <button key={c.hex} onClick={() => { setTool("player"); setPlayerColor(c.hex); }}
          style={{
            width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
            background: c.hex, cursor: "pointer",
            border: playerColor === c.hex ? "2.5px solid #fff" : "1.5px solid rgba(255,255,255,0.2)",
          }} />
      ))}
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button key={n} onClick={() => { setTool("player"); setPlayerNum(n); }}
          style={{
            ...tb(tool === "player" && playerNum === n, playerColor),
            width: 28, height: 28, borderRadius: "50%", padding: 0,
            fontSize: 11, fontWeight: 800,
            background: tool === "player" && playerNum === n ? playerColor : "rgba(255,255,255,0.04)",
            border: "1.5px solid " + (tool === "player" && playerNum === n ? playerColor : "rgba(255,255,255,0.1)"),
            color: tool === "player" && playerNum === n ? "#fff" : "#4a5568",
          }}>{n}
        </button>
      ))}
      {sep}
      <button onClick={() => setTool("cone")} style={{ ...tb(tool === "cone", "#f97316"), width: 34, fontSize: 15 }}>🔺</button>
      {sep}
      <button onClick={undo}  style={{ ...tb(false), width: 34, fontSize: 15 }}>↩</button>
      <button onClick={clear} style={{ ...tb(false), width: 34, fontSize: 14, color: "#f87171" }}>🗑</button>
      {sep}
      <button onClick={() => setFullscreen(f => !f)}
        style={{ ...tb(fullscreen, "#a78bfa"), width: 34, fontSize: 15 }}
        title={fullscreen ? "Stäng helskärm" : "Helskärm"}>
        {fullscreen ? "✕" : "⛶"}
      </button>
      {onSave && (<>
        {sep}
        <button onClick={() => { const d = exportDrawing(); if (d) onSave(d); }}
          style={{ ...tb(false, "#22c55e"), padding: "0 12px", background: "rgba(34,197,94,0.15)", border: "1.5px solid rgba(34,197,94,0.5)", color: "#22c55e", fontWeight: 800, fontSize: 13 }}>
          💾 Spara
        </button>
        {onCancel && (
          <button onClick={onCancel} style={{ ...tb(false), padding: "0 10px", color: "#f87171", border: "1.5px solid rgba(248,113,113,0.3)" }}>Avbryt</button>
        )}
      </>)}
    </div>
  );

  const boardJSX = (
    <div ref={wrapperRef} style={{ flex: 1, position: "relative", overflow: "hidden", touchAction: "none" }}>
      <canvas ref={canvasRef}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          display: "block", touchAction: "none",
          cursor: (tool === "player" || tool === "cone") ? "cell" : "crosshair",
        }}
        onPointerDown={onCanvasDown}
        onPointerMove={onCanvasMove}
        onPointerUp={onCanvasUp}
        onPointerCancel={onCanvasUp}
        onPointerLeave={onCanvasUp}
      />
      <TokenOverlay
        tokens={tokens} tool={tool}
        onTokenDown={onTokenDown}
        onTokenMove={onTokenMove}
        onTokenUp={onTokenUp}
      />
    </div>
  );

  const statusJSX = (
    <div style={{ padding: "4px 8px", fontSize: 10, color: "#2a5498", textAlign: "center", flexShrink: 0, background: "#0d1117" }}>
      {tool === "player"
        ? `Placerar spelare ${playerNum} — tryck tom yta = ny, dra befintlig = flytta`
        : tool === "cone"
        ? "Tryck tom yta = ny kon, dra befintlig = flytta"
        : "Hårdare tryck = tjockare linje (Apple Pencil)"}
    </div>
  );

  /* ── Fullscreen overlay ── */
  if (fullscreen) {
    const fsStyle = isPortrait
      ? {
          position: "fixed", width: "100vh", height: "100vw",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%) rotate(90deg)",
          transformOrigin: "center center",
          zIndex: 999, background: "#0d1117",
          display: "flex", flexDirection: "column",
        }
      : {
          position: "fixed", inset: 0,
          zIndex: 999, background: "#0d1117",
          display: "flex", flexDirection: "column",
        };

    return (
      <div style={fsStyle}>
        {toolbarJSX(true)}
        {boardJSX}
        {statusJSX}
      </div>
    );
  }

  /* ── Normal inline view ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 128px)", background: "#0d1117" }}>
      {toolbarJSX(false)}
      {boardJSX}
      {statusJSX}
    </div>
  );
}
