import { useState } from "react";
import { PCOLOR, PLABEL, gc } from "../../lib/constants.js";

export default function FormationCard({ line, lineIndex, allPlayers, usedIds, onAssign, onRemove, onRename, onDelete }) {
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(line.name);
  const [dragPos, setDragPos] = useState(null);

  const available = allPlayers.filter(p => !usedIds.has(p.id) || Object.values(line.slots).includes(p.id));

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, marginBottom: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {editName
          ? <input value={name} onChange={e => setName(e.target.value)} onBlur={() => { onRename(lineIndex, name); setEditName(false); }} onKeyDown={e => { if (e.key === "Enter") { onRename(lineIndex, name); setEditName(false); } }} autoFocus style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 13, padding: "4px 8px", fontFamily: "inherit", outline: "none", width: 120 }} />
          : <span onClick={() => setEditName(true)} style={{ fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer" }}>{line.name}</span>
        }
        <button onClick={() => onDelete(lineIndex)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
      </div>
      <div style={{ padding: "10px 16px" }}>
        {["forward", "vanster", "hoger", "back"].map(pos => {
          const pid = line.slots[pos];
          const player = pid ? allPlayers.find(p => p.id === pid) : null;
          const pc = PCOLOR[pos];
          return (
            <div key={pos}
              onDragOver={e => { e.preventDefault(); setDragPos(pos); }}
              onDragLeave={() => setDragPos(null)}
              onDrop={e => {
                e.preventDefault();
                const data = e.dataTransfer.getData("text/plain");
                if (data.startsWith("swap:")) {
                  const fromPos = data.replace("swap:", "");
                  onAssign(lineIndex, "__swap__", { from: fromPos, to: pos });
                } else {
                  onAssign(lineIndex, pos, data);
                }
                setDragPos(null);
              }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", background: dragPos === pos ? "rgba(34,197,94,0.06)" : "transparent" }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: pc, background: pc + "15", border: "1px solid " + pc + "30", borderRadius: 6, padding: "3px 6px", width: 32, textAlign: "center", flexShrink: 0 }}>{PLABEL[pos]}</span>
              {player ? (
                <div draggable onDragStart={e => e.dataTransfer.setData("text/plain", "swap:" + pos)} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, cursor: "grab" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: gc(player.group).color }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{player.name}</span>
                  <button onClick={() => onRemove(lineIndex, pos)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 14 }}>×</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
                  {available.filter(p => p.role !== "malvakt" && !Object.values(line.slots).includes(p.id)).map(p => (
                    <button key={p.id} draggable onDragStart={e => e.dataTransfer.setData("text/plain", p.id)} onClick={() => onAssign(lineIndex, pos, p.id)} style={{ padding: "4px 10px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 99, background: "transparent", color: "#4a5568", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>{p.name}</button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
