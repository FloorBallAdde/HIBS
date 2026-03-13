import { useState } from "react";
import { PCOLOR, PLABEL, gc } from "../../lib/constants.js";

/**
 * FormationCard — visar en linje med 4 positioner.
 * Sprint 5: Touch drag-and-drop via touchSwap prop (ersätter HTML5 drag som ej funkar på mobil).
 * Swap within card och cross-card hanteras av useTouchSwap i MatchContent.
 */
export default function FormationCard({
  line, lineIndex, allPlayers, usedIds,
  onAssign, onRemove, onRename, onDelete,
  touchSwap, // { onTouchStart, onTouchMove, onTouchEnd }
}) {
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(line.name);

  const available = allPlayers.filter(
    p => !usedIds.has(p.id) || Object.values(line.slots).includes(p.id)
  );

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, marginBottom: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {editName
          ? <input value={name} onChange={e => setName(e.target.value)} onBlur={() => { onRename(lineIndex, name); setEditName(false); }} onKeyDown={e => { if (e.key === "Enter") { onRename(lineIndex, name); setEditName(false); } }} autoFocus style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 13, padding: "4px 8px", fontFamily: "inherit", outline: "none", width: 120 }} />
          : <span onClick={() => setEditName(true)} style={{ fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer" }}>{line.name}</span>
        }
        <button onClick={() => onDelete(lineIndex)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
      </div>

      {/* Slots */}
      <div style={{ padding: "10px 16px" }}>
        {["forward", "vanster", "hoger", "back"].map((pos, pi) => {
          const pid    = line.slots[pos];
          const player = pid ? allPlayers.find(p => p.id === pid) : null;
          const pc     = PCOLOR[pos];
          // Slot-raden är drop-target — data-swap-slot berättar för useTouchSwap var vi landat
          const slotData = JSON.stringify({ li: lineIndex, pos });

          return (
            <div key={pos}
              data-swap-slot={slotData}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: pi < 3 ? "1px solid rgba(255,255,255,0.04)" : "none", borderRadius: 8, transition: "background 0.12s" }}
            >
              {/* Positionsbadge */}
              <span style={{ fontSize: 10, fontWeight: 900, color: pc, background: pc + "15", border: "1px solid " + pc + "30", borderRadius: 6, padding: "3px 6px", width: 32, textAlign: "center", flexShrink: 0 }}>{PLABEL[pos]}</span>

              {player ? (
                /* Fylld slot — touch-draggable */
                <div
                  onTouchStart={e => touchSwap?.onTouchStart(e, { li: lineIndex, pos }, player.name)}
                  onTouchMove={touchSwap?.onTouchMove}
                  onTouchEnd={touchSwap?.onTouchEnd}
                  style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, touchAction: "none", userSelect: "none", cursor: "grab" }}
                >
                  <span style={{ fontSize: 11, color: "#4a5568", flexShrink: 0 }}>⠿</span>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: gc(player.group).color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{player.name}</span>
                  <button
                    onClick={e => { e.stopPropagation(); onRemove(lineIndex, pos); }}
                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 14, padding: "4px", flexShrink: 0 }}
                  >×</button>
                </div>
              ) : (
                /* Tom slot — knapp-lista med tillgängliga spelare */
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
                  {available
                    .filter(p => p.role !== "malvakt" && !Object.values(line.slots).includes(p.id))
                    .map(p => (
                      <button
                        key={p.id}
                        onClick={() => onAssign(lineIndex, pos, p.id)}
                        style={{ padding: "4px 10px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 99, background: "transparent", color: "#4a5568", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}
                      >{p.name}</button>
                    ))
                  }
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
