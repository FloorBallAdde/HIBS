import { useState } from "react";
import { PCOLOR, PLABEL, gc, lineSlotKeys } from "../../lib/constants.js";

/**
 * FormationCard — visar en lina med 5 positioner (1-2-2) eller 4 (1-2-1).
 * Sprint 9: onTouchStart begränsad till ⠿-handtaget — förhindrar oavsiktliga
 * drag vid scroll eller när man trycker på spelarnamnet.
 * Sprint 5-manna: format-toggle 5v5/4v4 per lina; slot-nycklar via lineSlotKeys.
 */
export default function FormationCard({
  line,
  lineIndex,
  allPlayers,
  usedIds,
  onAssign,
  onRemove,
  onRename,
  onDelete,
  onFormat,
  touchSwap,
}) {
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(line.name);

  const available = allPlayers.filter(
    p => !usedIds.has(p.id) || Object.values(line.slots).includes(p.id)
  );

  const slotKeys = lineSlotKeys(line);
  const curFormat = slotKeys.length === 5 ? 5 : 4;

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      marginBottom: 12,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: "rgba(255,255,255,0.02)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        {editName ? (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => { onRename(lineIndex, name); setEditName(false); }}
            onKeyDown={e => { if (e.key === "Enter") { onRename(lineIndex, name); setEditName(false); } }}
            autoFocus
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 13, padding: "4px 8px", fontFamily: "inherit", outline: "none", width: 120 }}
          />
        ) : (
          <span onClick={() => setEditName(true)} style={{ fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {line.name}
          </span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Format-toggle 5v5/4v4 — 44px touch-höjd */}
          <div style={{ display: "flex", borderRadius: 9, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
            {[5, 4].map(f => (
              <button
                key={f}
                onClick={() => onFormat && onFormat(lineIndex, f)}
                aria-label={f + "-manna för " + line.name}
                style={{
                  padding: "10px 12px",
                  minHeight: 44,
                  border: "none",
                  background: curFormat === f ? "rgba(34,197,94,0.15)" : "transparent",
                  color: curFormat === f ? "#22c55e" : "#4a5568",
                  fontSize: 11,
                  fontWeight: 900,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                {f}v{f}
              </button>
            ))}
          </div>
          <button onClick={() => onDelete(lineIndex)} aria-label={"Ta bort " + line.name} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, padding: "10px 8px", minHeight: 44 }}>×</button>
        </div>
      </div>

      {/* Slots */}
      <div style={{ padding: "10px 16px" }}>
        {slotKeys.map((pos, pi) => {
          const pid = line.slots[pos];
          const player = pid ? allPlayers.find(p => p.id === pid) : null;
          const pc = PCOLOR[pos];
          const slotData = JSON.stringify({ li: lineIndex, pos });

          return (
            <div
              key={pos}
              data-swap-slot={slotData}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: pi < slotKeys.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                borderRadius: 8,
                transition: "background 0.12s",
              }}
            >
              {/* Positionsbadge */}
              <span style={{
                fontSize: 10, fontWeight: 900, color: pc,
                background: pc + "15", border: "1px solid " + pc + "30",
                borderRadius: 6, padding: "3px 6px",
                width: 32, textAlign: "center", flexShrink: 0,
              }}>
                {PLABEL[pos]}
              </span>

              {player ? (
                /* Fylld slot */
                <div
                  onTouchMove={touchSwap?.onTouchMove}
                  onTouchEnd={touchSwap?.onTouchEnd}
                  style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, userSelect: "none" }}
                >
                  {/* ⠿ Drag-handtag — ENDA elementet som startar drag */}
                  <span
                    onTouchStart={e => touchSwap?.onTouchStart(e, { li: lineIndex, pos }, player.name)}
                    style={{
                      fontSize: 16,
                      color: "#2e3d50",
                      padding: "8px 6px",
                      touchAction: "none",
                      cursor: "grab",
                      flexShrink: 0,
                      lineHeight: 1,
                      letterSpacing: "1px",
                    }}
                  >
                    ⠿
                  </span>

                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: gc(player.group).color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{player.name}</span>

                  <button
                    onClick={e => { e.stopPropagation(); onRemove(lineIndex, pos); }}
                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14, padding: "4px 8px", flexShrink: 0 }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                /* Tom slot — knapplista */
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1, minWidth: 0 }}>
                  {available
                    .filter(p => p.role !== "malvakt" && !Object.values(line.slots).includes(p.id))
                    .map(p => (
                      <button
                        key={p.id}
                        onClick={() => onAssign(lineIndex, pos, p.id)}
                        style={{ padding: "4px 10px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 99, background: "transparent", color: "#4a5568", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}
                      >
                        {p.name}
                      </button>
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
