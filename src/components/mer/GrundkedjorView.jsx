import { useState } from "react";
import { useApp } from "../../lib/AppContext.jsx";
import { KEDJE_GROUPS, LINE_FORMATS, PCOLOR, PLABEL, GC, groupLabel, groupShort, posLabel } from "../../lib/constants.js";

/**
 * GrundkedjorView — Mer → Grundkedjor (Sprint 83).
 * Redigerar grunduppställningen: tryck på en position → välj spelare.
 * Sparas direkt på spelaren (players.group = lina, players.position = plats),
 * så grupperna i Spelarlistan/Trupp visar samma lina + position.
 * Matchens kedjor laddas härifrån men ändringar i match slår aldrig tillbaka.
 */
export default function GrundkedjorView() {
  const { players, updP } = useApp();
  const [picking, setPicking] = useState(null); // { g, pos } eller null

  const field = players.filter(p => p.role !== "malvakt");
  const at = (g, pos) => field.find(p => p.group === g && p.position === pos) || null;
  const unplaced = field.filter(p => !p.position);

  const assign = async (player) => {
    const { g, pos } = picking;
    setPicking(null);
    const current = at(g, pos);
    if (current && current.id === player.id) return;
    if (current) await updP(current.id, { position: null }); // den som stod där blir utan plats
    await updP(player.id, { group: g, position: pos });
  };

  const clearSlot = async () => {
    const current = at(picking.g, picking.pos);
    setPicking(null);
    if (current) await updP(current.id, { position: null });
  };

  const placeText = (p) => p.position ? groupShort(p.group) + " · " + posLabel(p.position) : "Ingen plats";

  return (
    <div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 1.5 }}>
        Tryck på en position för att byta spelare. Ändringen sparas direkt och gäller nästa gång du laddar grundkedjor i en match.
      </div>

      {KEDJE_GROUPS.map(g => {
        const col = GC[g].color;
        return (
          <div key={g} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, marginBottom: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13, fontWeight: 800, color: col }}>
              {groupLabel(g)}
            </div>
            <div style={{ padding: "4px 16px" }}>
              {LINE_FORMATS[5].map((pos, pi) => {
                const p = at(g, pos);
                const pc = PCOLOR[pos];
                return (
                  <button
                    key={pos}
                    onClick={() => setPicking({ g, pos })}
                    style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 48, padding: "8px 0", background: "none", border: "none", borderBottom: pi < 4 ? "1px solid rgba(255,255,255,0.04)" : "none", fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 900, color: pc, background: pc + "15", border: "1px solid " + pc + "30", borderRadius: 6, padding: "4px 0", width: 38, textAlign: "center", flexShrink: 0 }}>
                      {PLABEL[pos]}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: p ? "#fff" : "#4a5568", fontStyle: p ? "normal" : "italic" }}>
                      {p ? p.name : "Tom — tryck för att välja"}
                    </span>
                    <span style={{ marginLeft: "auto", color: "#4a5568", fontSize: 14 }}>›</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {unplaced.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16, padding: "12px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", marginBottom: 8 }}>UTAN PLATS I GRUNDKEDJORNA</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {unplaced.map(p => (
              <span key={p.id} style={{ padding: "6px 12px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>{p.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Väljare — bottenark */}
      {picking && (
        <div onClick={() => setPicking(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxHeight: "75vh", overflowY: "auto", background: "#12151f", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "16px 16px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
                {groupLabel(picking.g)} · <span style={{ color: PCOLOR[picking.pos] }}>{PLABEL[picking.pos]}</span>
              </div>
              <button onClick={() => setPicking(null)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 22, minWidth: 44, minHeight: 44, cursor: "pointer" }}>×</button>
            </div>
            {at(picking.g, picking.pos) && (
              <button onClick={clearSlot} style={{ width: "100%", minHeight: 44, marginBottom: 10, border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12, background: "rgba(248,113,113,0.06)", color: "#f87171", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>
                Ta bort {at(picking.g, picking.pos).name} från platsen
              </button>
            )}
            {[...field].sort((a, b) => (a.position ? 1 : 0) - (b.position ? 1 : 0) || a.name.localeCompare(b.name, "sv")).map(p => {
              const here = p.group === picking.g && p.position === picking.pos;
              return (
                <button
                  key={p.id}
                  onClick={() => assign(p)}
                  style={{ display: "flex", alignItems: "center", width: "100%", minHeight: 48, padding: "8px 12px", marginBottom: 6, border: "1px solid " + (here ? "#22c55e" : "rgba(255,255,255,0.07)"), borderRadius: 12, background: here ? "rgba(34,197,94,0.08)" : "transparent", fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{p.name}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: p.position ? GC[p.group]?.color || "#64748b" : "#4a5568" }}>{placeText(p)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
