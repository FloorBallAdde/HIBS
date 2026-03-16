/**
 * TaktiktavlaTab — Officiell innebandyplan (IFF-standard).
 * Blå yta, vita linjer, rektangulära målområden.
 * Verktyg: penna, sudd, ångra, rensa + spelare 1–10 (röd/blå) + koner.
 * Apple Pencil-stöd via Pointer Events API med tryckkänslighet.
 */
import { useRef, useState, useEffect, useCallback } from "react";

function drawRink(ctx, W, H) {
  const m = 14;
  const rw = W - m * 2;
  const rh = H - m * 2;

  // Mörkblå bakgrund
  ctx.fillStyle = "#1a4a8a";
  ctx.fillRect(0, 0, W, H);

  // Ljusare blå planyta
  ctx.fillStyle = "#1e55a0";
  ctx.fillRect(m, m, rw, rh);

  const line = (w, a = 1) => { ctx.lineWidth = w; ctx.strokeStyle = `rgba(255,255,255,${a})`; };

  // Planens kant
  line(2.5); ctx.strokeRect(m, m, rw, rh);

  // Mittlinje (röd, IFF-standard)
  ctx.strokeStyle = "rgba(220,40,40,0.85)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2, m); ctx.lineTo(W / 2, m + rh); ctx.stroke();

  // Mittcirkel
  line(1.8, 0.75);
  ctx.beginPath(); ctx.arc(W / 2, H / 2, rw * 0.09, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 3, 0, Math.PI * 2); ctx.fill();

  // Målområden (5m×7.5m / 40×20 → 12.5% × 37.5%)
  const gaW = rw * 0.125;
  const gaH = rh * 0.375;
  const gaY = m + (rh - gaH) / 2;
  line(1.5, 0.8);
  ctx.strokeRect(m, gaY, gaW, gaH);
  ctx.strokeRect(m + rw - gaW, gaY, gaW, gaH);

  // Keeperzoner (inre, ca 40% × 45% av målområde)
  const kkW = gaW * 0.42; const kkH = gaH * 0.46;
  const kkY = m + (rh - kkH) / 2;
  line(1, 0.45);
  ctx.strokeRect(m, kkY, kkW, kkH);
  ctx.strokeRect(m + rw - kkW, kkY, kkW, kkH);

  // Mål
  const netH = rh * 0.13; const netW = 5;
  const netY = H / 2 - netH / 2;
  ctx.fillStyle = "rgba(255,255,255,0.09)";
  ctx.fillRect(m - netW, netY, netW, netH);
  ctx.fillRect(m + rw, netY, netW, netH);
  line(1.5, 0.7);
  ctx.strokeRect(m - netW, netY, netW, netH);
  ctx.strokeRect(m + rw, netY, netW, netH);

  // Anspelningspunkter
  const fpX = rw * 0.22; const fpY = rh * 0.075;
  [[m + fpX, m + fpY], [m + fpX, m + rh - fpY],
   [m + rw - fpX, m + fpY], [m + rw - fpX, m + rh - fpY]].forEach(([x, y]) => {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  });
}

function stampPlayer(ctx, x, y, num, color) {
  const r = 14;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${num > 9 ? 10 : 12}px system-ui`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(String(num), x, y);
  ctx.restore();
}

function stampCone(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = "#f97316"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y - 11); ctx.lineTo(x + 9, y + 7); ctx.lineTo(x - 9, y + 7);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

const PEN_COLORS = [
  { hex: "#ffffff" }, { hex: "#ef4444" }, { hex: "#fbbf24" }, { hex: "#22c55e" },
];
const PEN_SIZES = [2, 4, 7];
const PLAYER_COLS = [{ hex: "#ef4444", label: "Röd" }, { hex: "#38bdf8", label: "Blå" }];

export default function TaktiktavlaTab() {
  const canvasRef = useRef(null);
  const rinkRef   = useRef(null);
  const undoStack = useRef([]);
  const isDrawing = useRef(false);
  const lastPt    = useRef(null);

  const [tool,        setTool]        = useState("pen");
  const [penColor,    setPenColor]    = useState("#ffffff");
  const [penSize,     setPenSize]     = useState(3);
  const [playerNum,   setPlayerNum]   = useState(1);
  const [playerColor, setPlayerColor] = useState("#ef4444");

  const initCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const p = c.parentElement;
    c.width = p.clientWidth; c.height = p.clientHeight;
    const rink = document.createElement("canvas");
    rink.width = c.width; rink.height = c.height;
    drawRink(rink.getContext("2d"), rink.width, rink.height);
    rinkRef.current = rink;
    c.getContext("2d").drawImage(rink, 0, 0);
    undoStack.current = [];
  }, []);

  useEffect(() => {
    initCanvas();
    window.addEventListener("resize", initCanvas);
    return () => window.removeEventListener("resize", initCanvas);
  }, [initCanvas]);

  const snap = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const s = c.getContext("2d").getImageData(0, 0, c.width, c.height);
    undoStack.current.push(s);
    if (undoStack.current.length > 40) undoStack.current.shift();
  }, []);

  const undo  = () => { const c = canvasRef.current; if (c && undoStack.current.length) c.getContext("2d").putImageData(undoStack.current.pop(), 0, 0); };
  const clear = () => { const c = canvasRef.current; if (c && rinkRef.current) { snap(); c.getContext("2d").drawImage(rinkRef.current, 0, 0); } };

  const getPos = (e) => {
    const c = canvasRef.current; const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };

  const onDown = useCallback((e) => {
    e.preventDefault();
    const pt = getPos(e);
    if (tool === "player") { snap(); stampPlayer(canvasRef.current.getContext("2d"), pt.x, pt.y, playerNum, playerColor); return; }
    if (tool === "cone")   { snap(); stampCone(canvasRef.current.getContext("2d"), pt.x, pt.y); return; }
    snap(); isDrawing.current = true; lastPt.current = pt;
    canvasRef.current?.setPointerCapture?.(e.pointerId);
  }, [tool, playerNum, playerColor, snap]);

  const onMove = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current || !lastPt.current) return;
    const c = canvasRef.current; const ctx = c.getContext("2d"); const pt = getPos(e);
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
      const t2 = c.getContext("2d"); t2.save();
      t2.globalCompositeOperation = "destination-over"; t2.drawImage(rinkRef.current, 0, 0); t2.restore();
    }
    lastPt.current = pt;
  }, [tool, penColor, penSize]);

  const onUp = useCallback((e) => { e.preventDefault(); isDrawing.current = false; lastPt.current = null; }, []);

  const tb = (active, accent) => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 9, height: 34,
    border: "1.5px solid " + (active ? (accent || "#fff") : "rgba(255,255,255,0.1)"),
    background: active ? "rgba(255,255,255,0.1)" : "transparent",
    color: active ? "#fff" : "#4a5568", cursor: "pointer",
    fontFamily: "inherit", fontSize: 13, flexShrink: 0, padding: "0 7px",
  });
  const sep = <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 128px)" }}>
      {/* Verktygsfält */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,0.06)", overflowX: "auto", flexShrink: 0 }}>

        {PEN_SIZES.map(s => (
          <button key={s} onClick={() => { setTool("pen"); setPenSize(s); }}
            style={{ ...tb(tool === "pen" && penSize === s), width: 30 }}>
            <div style={{ width: s * 2.8, height: s * 2.8, borderRadius: "50%", background: tool === "pen" && penSize === s ? penColor : "#4a5568" }} />
          </button>
        ))}

        {sep}

        {PEN_COLORS.map(c => (
          <button key={c.hex} onClick={() => { setTool("pen"); setPenColor(c.hex); }}
            style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: c.hex, cursor: "pointer",
              border: tool === "pen" && penColor === c.hex ? "3px solid #fff" : "1.5px solid rgba(255,255,255,0.25)" }} />
        ))}

        {sep}

        <button onClick={() => setTool("eraser")} style={{ ...tb(tool === "eraser"), width: 34, fontSize: 16 }}>⌫</button>

        {sep}

        {/* Spelarfärg */}
        {PLAYER_COLS.map(c => (
          <button key={c.hex} onClick={() => { setTool("player"); setPlayerColor(c.hex); }}
            style={{ width: 12, height: 12, borderRadius: "50%", flexShrink: 0, background: c.hex, cursor: "pointer",
              border: playerColor === c.hex ? "2px solid #fff" : "1px solid rgba(255,255,255,0.2)" }} />
        ))}

        {/* Spelar-tokens 1–10 */}
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} onClick={() => { setTool("player"); setPlayerNum(n); }}
            style={{ ...tb(tool === "player" && playerNum === n, playerColor),
              width: 28, height: 28, borderRadius: "50%", padding: 0, fontSize: 11, fontWeight: 800,
              background: tool === "player" && playerNum === n ? playerColor : "rgba(255,255,255,0.04)",
              border: "1.5px solid " + (tool === "player" && playerNum === n ? playerColor : "rgba(255,255,255,0.1)"),
              color: tool === "player" && playerNum === n ? "#fff" : "#4a5568",
            }}>
            {n}
          </button>
        ))}

        {sep}

        <button onClick={() => setTool("cone")} style={{ ...tb(tool === "cone", "#f97316"), width: 34, fontSize: 15 }}>🔺</button>

        {sep}

        <button onClick={undo}  style={{ ...tb(false), width: 34, fontSize: 15 }}>↩</button>
        <button onClick={clear} style={{ ...tb(false), width: 34, fontSize: 14, color: "#f87171" }}>🗑</button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, overflow: "hidden", touchAction: "none" }}>
        <canvas ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: "crosshair" }}
          onPointerDown={onDown} onPointerMove={onMove}
          onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp} />
      </div>

      <div style={{ padding: "4px 8px", fontSize: 10, color: "#1a3d72", textAlign: "center", flexShrink: 0 }}>
        {tool === "player" ? `Tryck för att placera spelare ${playerNum}` :
         tool === "cone"   ? "Tryck för att placera en kon" :
         "Hårdare tryck = tjockare linje (Apple Pencil)"}
      </div>
    </div>
  );
}
