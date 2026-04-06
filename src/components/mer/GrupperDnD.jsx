// src/components/mer/GrupperDnD.jsx
// Sprint 28: extraherad från MerContent.jsx (var definierad inline)
import { useState } from "react";
import { GROUPS, GC } from "../../lib/constants.js";

const ALL_GROUPS = [...GROUPS, "MV"]; // A B C D E MV

function PlayerChip({ p, col, isDragging, onDragStart, onDragEnd, updP }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <div
        draggable
        onDragStart={e => onDragStart(e, p.id)}
        onDragEnd={onDragEnd}
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "6px 12px",
          borderRadius: 99,
          background: isDragging ? "rgba(255,255,255,0.12)" : col.bg,
          border: "1.5px solid " + (isDragging ? "rgba(255,255,255,0.3)" : col.color),
          color: isDragging ? "#94a3b8" : col.color,
          fontSize: 12, fontWeight: 700,
          cursor: "grab",
          userSelect: "none",
          opacity: isDragging ? 0.5 : 1,
          transition: "opacity 0.15s",
        }}>
        {p.name}
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: "#1e2235", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: 6, display: "flex", gap: 4, zIndex: 50 }}>
          {ALL_GROUPS.map(ng => {
            const ngc = GC[ng] || GC._;
            const active = p.group === ng;
            return (
              <button key={ng} onClick={() => { updP(p.id, { group: ng }); setOpen(false); }}
                style={{ width: 30, height: 30, border: "1.5px solid " + (active ? ngc.color : "rgba(255,255,255,0.1)"), borderRadius: 7, background: active ? ngc.bg : "transparent", color: active ? ngc.color : "#4a5568", fontSize: 10, fontWeight: 900, fontFamily: "inherit", cursor: "pointer" }}>
                {ng}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function GrupperDnD({ players, updP }) {
  const [dragId, setDragId] = useState(null);
  const [overGroup, setOverGroup] = useState(null);

  const onDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const onDragOver = (e, g) => { e.preventDefault(); setOverGroup(g); };
  const onDragLeave = () => setOverGroup(null);
  const onDrop = (e, g) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    if (id) updP(id, { group: g });
    setDragId(null); setOverGroup(null);
  };
  const onDragEnd = () => { setDragId(null); setOverGroup(null); };

  const unassigned = players.filter(p => !ALL_GROUPS.includes(p.group));

  return (
    <div>
      <div style={{ fontSize: 11, color: "#4a5568", marginBottom: 14 }}>
        Dra spelare mellan grupper, eller tryck på ett namn och välj grupp.
      </div>
      {ALL_GROUPS.map(g => {
        const inGroup = players.filter(p => p.group === g);
        const col = GC[g] || GC._;
        const isOver = overGroup === g;
        return (
          <div key={g}
            onDragOver={e => onDragOver(e, g)}
            onDragLeave={onDragLeave}
            onDrop={e => onDrop(e, g)}
            style={{
              marginBottom: 12,
              borderRadius: 14,
              border: "1.5px solid " + (isOver ? col.color : "rgba(255,255,255,0.07)"),
              background: isOver ? col.bg : "rgba(255,255,255,0.02)",
              padding: "10px 12px",
              transition: "border-color 0.15s, background 0.15s",
              minHeight: 54,
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: inGroup.length ? 8 : 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, background: col.bg, border: "1.5px solid " + col.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: col.color }}>{g}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: col.color }}>Grupp {g}</span>
              <span style={{ fontSize: 11, color: "#4a5568" }}>· {inGroup.length} sp.</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {inGroup.map(p => (
                <PlayerChip key={p.id} p={p} col={col} isDragging={dragId === p.id}
                  onDragStart={onDragStart} onDragEnd={onDragEnd} updP={updP} />
              ))}
              {inGroup.length === 0 && (
                <span style={{ fontSize: 11, color: "#2d3748", fontStyle: "italic" }}>Dra hit…</span>
              )}
            </div>
          </div>
        );
      })}
      {unassigned.length > 0 && (
        <div style={{ marginTop: 4, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#4a5568", marginBottom: 6 }}>Utan grupp</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {unassigned.map(p => (
              <PlayerChip key={p.id} p={p} col={GC._} isDragging={dragId === p.id}
                onDragStart={onDragStart} onDragEnd={onDragEnd} updP={updP} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
