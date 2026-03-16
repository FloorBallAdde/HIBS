/**
 * TaktiktavlaTab — iPad-optimerad taktiktavla med innebandyplan.
 * Stödjer Apple Pencil via Pointer Events API.
 * Verktyg: penna (4 färger), sudd, ångra, rensa.
 */
import { useRef, useState, useEffect, useCallback } from "react";

const COLORS = [
  { id: "red",    hex: "#ef4444", label: "Röd"    },
  { id: "white",  hex: "#ffffff", label: "Vit"    },
  { id: "yellow", hex: "#fbbf24", label: "Gul"    },
  { id: "blue",   hex: "#38bdf8", label: "Blå"    },
];

const SIZES = [2, 4, 7];

function drawRink(ctx, w, h) {
  const m = 18;  // margin
  const rw = w - m * 2;
  const rh = h - m * 2;
  const cr = Math.min(rw, rh) * 0.1; // corner radius

  // Bakgrund
  ctx.fillStyle = "#0f2535";
  ctx.fillRect(0, 0, w, h);

  // Hjälpfunktion: rundad rektangel
  const roundRect = (x, y, bw, bh, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + bw - r, y);
    ctx.arcTo(x + bw, y, x + bw, y + r, r);
    ctx.lineTo(x + bw, y + bh - r);
    ctx.arcTo(x + bw, y + bh, x + bw - r, y + bh, r);
    ctx.lineTo(x + r, y + bh);
    ctx.arcTo(x, y + bh, x, y + bh - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  };

  // Plan-yta (ljusgrön)
  ctx.fillStyle = "#0d3d1e";
  roundRect(m, m, rw, rh, cr);
  ctx.fill();

  // Plan-kant (vit)
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2.5;
  roundRect(m, m, rw, rh, cr);
  ctx.stroke();

  // Mittlinje (röd)
  ctx.strokeStyle = "rgba(220,40,40,0.8)";
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(w / 2, m);
  ctx.lineTo(w / 2, m + rh);
  ctx.stroke();

  // Mittkrets
  const midR = rh * 0.18;
  ctx.strokeStyle = "rgba(220,40,40,0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, midR, 0, Math.PI * 2);
  ctx.stroke();

  // Mittdot
  ctx.fillStyle = "rgba(220,40,40,0.9)";
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Målområden
  const gaW = rw * 0.14;
  const gaH = rh * 0.42;
  const gaY = m + (rh - gaH) / 2;
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  // Vänster
  ctx.strokeRect(m, gaY, gaW, gaH);
  // Höger
  ctx.strokeRect(m + rw - gaW, gaY, gaW, gaH);

  // Mål (nätfyllning)
  const netW = 8;
  const netH = rh * 0.17;
  const netY = m + (rh - netH) / 2;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(m - netW, netY, netW, netH);
  ctx.fillRect(m + rw, netY, netW, netH);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(m - netW, netY, netW, netH);
  ctx.strokeRect(m + rw, netY, netW, netH);

  // Anspelningspunkter (4 st)
  const fpX = rw * 0.22;
  const fpY = rh * 0.27;
  const fps = [
    [m + fpX,       m + fpY],
    [m + fpX,       m + rh - fpY],
    [m + rw - fpX,  m + fpY],
    [m + rw - fpX,  m + rh - fpY],
  ];
  ctx.fillStyle = "rgba(220,40,40,0.85)";
  fps.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

export default function TaktiktavlaTab() {
  const canvasRef   = useRef(null);
  const rinkRef     = useRef(null); // off-screen canvas för rink-bakgrunden
  const undoStack   = useRef([]);
  const isDrawing   = useRef(false);
  const lastPt      = useRef(null);

  const [color,  setColor]  = useState("#ef4444");
  const [size,   setSize]   = useState(4);
  const [tool,   setTool]   = useState("pen"); // "pen" | "eraser"

  // Initialisera canvas + rink
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width  = parent.clientWidth;
    canvas.height = parent.clientHeight;

    // Rita rinkbakgrunden på off-screen canvas
    const rink = document.createElement("canvas");
    rink.width  = canvas.width;
    rink.height = canvas.height;
    drawRink(rink.getContext("2d"), rink.width, rink.height);
    rinkRef.current = rink;

    // Rita rink på huvudcanvas
    const ctx = canvas.getContext("2d");
    ctx.drawImage(rink, 0, 0);
    undoStack.current = [];
  }, []);

  useEffect(() => {
    initCanvas();
    const onResize = () => initCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [initCanvas]);

  // Spara snapshot för undo
  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snap = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
    undoStack.current.push(snap);
    if (undoStack.current.length > 30) undoStack.current.shift();
  }, []);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || undoStack.current.length === 0) return;
    const snap = undoStack.current.pop();
    canvas.getContext("2d").putImageData(snap, 0, 0);
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rinkRef.current) return;
    saveSnapshot();
    canvas.getContext("2d").drawImage(rinkRef.current, 0, 0);
  }, [saveSnapshot]);

  // Hämta koordinater (stödjer touch, mus och Apple Pencil)
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    saveSnapshot();
    isDrawing.current = true;
    lastPt.current    = getPos(e);
    canvasRef.current?.setPointerCapture?.(e.pointerId);
  }, [saveSnapshot]);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current || !lastPt.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const pt     = getPos(e);

    ctx.save();
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth   = size * 5;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      // Apple Pencil pressure (0–1), fallback till 1
      const pressure = e.pressure > 0 ? e.pressure : 1;
      ctx.lineWidth  = size * (0.5 + pressure * 0.8);
    }
    ctx.lineCap  = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(lastPt.current.x, lastPt.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();

    // Återrit rink under suddning för att bevara planen
    if (tool === "eraser") {
      const tempCtx = canvas.getContext("2d");
      tempCtx.save();
      tempCtx.globalCompositeOperation = "destination-over";
      tempCtx.drawImage(rinkRef.current, 0, 0);
      tempCtx.restore();
    }

    lastPt.current = pt;
  }, [color, size, tool]);

  const stopDraw = useCallback((e) => {
    e.preventDefault();
    isDrawing.current = false;
    lastPt.current    = null;
  }, []);

  const btnStyle = (active, col) => ({
    width: 36, height: 36, borderRadius: 10,
    border: "2px solid " + (active ? col || "#fff" : "rgba(255,255,255,0.12)"),
    background: active ? "rgba(255,255,255,0.12)" : "transparent",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit", flexShrink: 0,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)", gap: 0 }}>

      {/* Verktygsfält */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 4px", overflowX: "auto", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Pennstorlekar */}
        {SIZES.map(s => (
          <button key={s} onClick={() => { setTool("pen"); setSize(s); }}
            style={{
              ...btnStyle(tool === "pen" && size === s),
              width: 32, height: 32,
            }}>
            <div style={{
              width: s * 2.5, height: s * 2.5, borderRadius: "50%",
              background: tool === "pen" && size === s ? color : "rgba(255,255,255,0.3)",
            }}/>
          </button>
        ))}

        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)", margin: "0 2px" }}/>

        {/* Färger */}
        {COLORS.map(c => (
          <button key={c.id} onClick={() => { setTool("pen"); setColor(c.hex); }}
            title={c.label}
            style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: c.hex,
              border: tool === "pen" && color === c.hex ? "3px solid #fff" : "2px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
            }}/>
        ))}

        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)", margin: "0 2px" }}/>

        {/* Sudd */}
        <button onClick={() => setTool("eraser")} title="Sudd"
          style={btnStyle(tool === "eraser")}>
          <span style={{ fontSize: 16 }}>⌫</span>
        </button>

        {/* Ångra */}
        <button onClick={undo} title="Ångra"
          style={btnStyle(false)}>
          <span style={{ fontSize: 14 }}>↩</span>
        </button>

        {/* Rensa */}
        <button onClick={clear} title="Rensa allt"
          style={{ ...btnStyle(false), marginLeft: "auto" }}>
          <span style={{ fontSize: 13, color: "#f87171" }}>🗑</span>
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, overflow: "hidden", touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: tool === "eraser" ? "cell" : "crosshair" }}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={stopDraw}
          onPointerCancel={stopDraw}
          onPointerLeave={stopDraw}
        />
      </div>

      {/* Tips */}
      <div style={{ padding: "6px 8px", fontSize: 10, color: "#2d3748", textAlign: "center", flexShrink: 0 }}>
        Rita med finger eller Apple Pencil · Tryck hårdare för tjockare linje
      </div>
    </div>
  );
}
