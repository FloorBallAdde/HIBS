import { useState, useCallback } from "react";
import { GROUPS, GC, gc, CHAIN_POS, CHAIN_COL } from "../../lib/constants.js";
import { useTouchSwap } from "../../hooks/useTouchSwap.js";

/**
 * GrupperMode — Kedjor med drag-and-drop.
 * Utgår från spelarnas vanliga grupper men låter Andreas bygga kedjor (anfallslinjer)
 * med positioner (1:a, V2:a, H2:a, 3:a) och dra spelare fritt mellan kedjorna.
 */
export default function GrupperMode({ field, onUpdateGroup }) {
  // Bygg kedjor från grupper — varje grupp = en kedja
  const [chains, setChains] = useState(() => {
    const c = [];
    GROUPS.forEach(g => {
      const gp = field.filter(p => p.group === g);
      if (gp.length > 0) {
        c.push({ name: "Kedja " + g, groupId: g, slots: gp.map(p => p.id) });
      }
    });
    return c;
  });
  const [pool, setPool] = useState(() => {
    // Spelare som inte fick plats i en grupp
    const assigned = new Set(chains.flatMap(c => c.slots));
    return field.filter(p => !assigned.has(p.id)).map(p => p.id);
  });
  const [editName, setEditName] = useState(null);

  // Hitta spelare-objekt från id
  const pById = (id) => field.find(p => p.id === id);

  // Flytta spelare: från kedja/pool till kedja/pool
  const movePlayer = useCallback((src, dst) => {
    if (src.area === dst.area && src.index === dst.index) return;
    if (src.area === "pool" && dst.area === "pool") return;

    setChains(prev => {
      const next = prev.map(c => ({ ...c, slots: [...c.slots] }));

      // Plocka ut spelaren från källan
      let playerId;
      if (src.area === "pool") {
        playerId = pool[src.index];
        setPool(p => p.filter((_, i) => i !== src.index));
      } else {
        playerId = next[src.area]?.slots[src.index];
        if (next[src.area]) next[src.area].slots.splice(src.index, 1);
      }
      if (!playerId) return prev;

      // Sätt in spelaren på målet
      if (dst.area === "pool") {
        setPool(p => [...p, playerId]);
      } else {
        if (!next[dst.area]) return prev;
        // Om vi droppar på en specifik position, infoga där
        const insertAt = dst.index !== undefined ? dst.index : next[dst.area].slots.length;
        next[dst.area].slots.splice(insertAt, 0, playerId);
      }

      return next;
    });
  }, [pool]);

  // Swap: byt plats på två spelare direkt
  const swapPlayers = useCallback((src, dst) => {
    setChains(prev => {
      const next = prev.map(c => ({ ...c, slots: [...c.slots] }));

      const srcIsPool = src.area === "pool";
      const dstIsPool = dst.area === "pool";

      let srcId, dstId;

      if (srcIsPool) {
        srcId = pool[src.index];
      } else {
        srcId = next[src.area]?.slots[src.index];
      }

      if (dstIsPool) {
        dstId = pool[dst.index];
      } else {
        dstId = next[dst.area]?.slots[dst.index];
      }

      if (!srcId) return prev;

      // Om destinationen är tom, flytta dit
      if (!dstId) {
        if (srcIsPool) {
          setPool(p => p.filter((_, i) => i !== src.index));
        } else {
          next[src.area].slots.splice(src.index, 1);
        }
        if (dstIsPool) {
          setPool(p => [...p, srcId]);
        } else if (dst.index !== undefined && dst.index <= next[dst.area].slots.length) {
          next[dst.area].slots.splice(dst.index, 0, srcId);
        } else {
          next[dst.area].slots.push(srcId);
        }
        return next;
      }

      // Byt plats
      if (srcIsPool && dstIsPool) {
        setPool(p => {
          const n = [...p];
          [n[src.index], n[dst.index]] = [n[dst.index], n[src.index]];
          return n;
        });
        return prev;
      }

      if (srcIsPool) {
        setPool(p => { const n = [...p]; n[src.index] = dstId; return n; });
        next[dst.area].slots[dst.index] = srcId;
      } else if (dstIsPool) {
        next[src.area].slots[src.index] = dstId;
        setPool(p => { const n = [...p]; n[dst.index] = srcId; return n; });
      } else {
        next[src.area].slots[src.index] = dstId;
        next[dst.area].slots[dst.index] = srcId;
      }

      return next;
    });
  }, [pool]);

  // Touch drag-and-drop
  const touchSwap = useTouchSwap({
    onSwap: useCallback((src, dst) => {
      swapPlayers(src, dst);
    }, [swapPlayers]),
  });

  // Lägg till ny kedja
  const addChain = () => {
    setChains(prev => [...prev, { name: "Kedja " + (prev.length + 1), groupId: null, slots: [] }]);
  };

  // Ta bort kedja (flytta spelare till pool)
  const removeChain = (ci) => {
    setChains(prev => {
      const removed = prev[ci];
      if (removed) setPool(p => [...p, ...removed.slots]);
      return prev.filter((_, i) => i !== ci);
    });
  };

  // Byt namn på kedja
  const renameChain = (ci, name) => {
    setChains(prev => prev.map((c, i) => i === ci ? { ...c, name } : c));
  };

  // Flytta spelare från pool → kedja (snabb-tillägg via tryck)
  const addToChain = (ci, playerId) => {
    setPool(p => p.filter(id => id !== playerId));
    setChains(prev => prev.map((c, i) => i === ci ? { ...c, slots: [...c.slots, playerId] } : c));
  };

  // Flytta spelare från kedja → pool
  const removeFromChain = (ci, slotIdx) => {
    setChains(prev => {
      const next = prev.map(c => ({ ...c, slots: [...c.slots] }));
      const pid = next[ci].slots.splice(slotIdx, 1)[0];
      if (pid) setPool(p => [...p, pid]);
      return next;
    });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>Kedjor</div>
        <button onClick={addChain} style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 99, padding: "6px 14px", fontFamily: "inherit", cursor: "pointer" }}>+ Ny kedja</button>
      </div>

      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>Dra ⠿ handtaget för att flytta spelare mellan kedjorna.</div>

      {chains.map((chain, ci) => {
        const gColor = chain.groupId ? GC[chain.groupId]?.color : "#a78bfa";
        return (
          <div key={ci} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, marginBottom: 14, overflow: "hidden" }}>
            {/* Kedja header */}
            <div style={{ background: gColor + "15", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: gColor + "25", border: "1px solid " + gColor + "50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: gColor }}>{ci + 1}</span>
              </div>
              {editName === ci ? (
                <input
                  autoFocus
                  value={chain.name}
                  onChange={e => renameChain(ci, e.target.value)}
                  onBlur={() => setEditName(null)}
                  onKeyDown={e => e.key === "Enter" && setEditName(null)}
                  style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 8px", fontFamily: "inherit", outline: "none", flex: 1 }}
                />
              ) : (
                <span onClick={() => setEditName(ci)} style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", cursor: "pointer", flex: 1 }}>{chain.name}</span>
              )}
              <span style={{ fontSize: 10, color: "#4a5568" }}>{chain.slots.length} spelare</span>
              <button onClick={() => removeChain(ci)} style={{ fontSize: 12, color: "#4a5568", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", fontFamily: "inherit" }}>✕</button>
            </div>

            {/* Spelare i kedjan */}
            <div style={{ padding: chain.slots.length > 0 ? "8px 0" : "0" }}>
              {chain.slots.map((id, pi) => {
                const p = pById(id);
                if (!p) return null;
                const pos = CHAIN_POS[pi] || ("Pos " + (pi + 1));
                const pc = CHAIN_COL[pos] || "#64748b";
                const slotData = JSON.stringify({ area: ci, index: pi });
                return (
                  <div
                    key={id}
                    data-swap-slot={slotData}
                    onTouchMove={touchSwap.onTouchMove}
                    onTouchEnd={touchSwap.onTouchEnd}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderBottom: pi < chain.slots.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", userSelect: "none" }}
                  >
                    <span
                      onTouchStart={e => touchSwap.onTouchStart(e, { area: ci, index: pi }, p.name)}
                      style={{ fontSize: 16, color: "#2e3d50", padding: "8px 6px", touchAction: "none", cursor: "grab", flexShrink: 0, lineHeight: 1, letterSpacing: "1px" }}
                    >⠿</span>
                    <span style={{ fontSize: 10, fontWeight: 900, color: pc, background: pc + "15", border: "1px solid " + pc + "30", borderRadius: 6, padding: "3px 6px", width: 38, textAlign: "center", flexShrink: 0 }}>{pos}</span>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: gc(p.group).color, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", flex: 1 }}>{p.name}</span>
                    <button onClick={() => removeFromChain(ci, pi)} style={{ fontSize: 11, color: "#4a5568", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", fontFamily: "inherit" }}>✕</button>
                  </div>
                );
              })}
            </div>

            {/* Drop-zon om kedjan är tom */}
            {chain.slots.length === 0 && (
              <div
                data-swap-slot={JSON.stringify({ area: ci, index: 0 })}
                onTouchMove={touchSwap.onTouchMove}
                onTouchEnd={touchSwap.onTouchEnd}
                style={{ padding: "20px 16px", textAlign: "center", fontSize: 12, color: "#4a5568" }}
              >
                Dra spelare hit eller tryck i poolen nedan
              </div>
            )}
          </div>
        );
      })}

      {/* Pool — spelare som inte tillhör någon kedja */}
      {pool.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", letterSpacing: "0.1em", marginBottom: 10 }}>TILLGÄNGLIGA SPELARE ({pool.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {pool.map((id, pi) => {
              const p = pById(id);
              if (!p) return null;
              const pgc = gc(p.group);
              const slotData = JSON.stringify({ area: "pool", index: pi });
              return (
                <div
                  key={id}
                  data-swap-slot={slotData}
                  onTouchMove={touchSwap.onTouchMove}
                  onTouchEnd={touchSwap.onTouchEnd}
                  style={{ display: "flex", alignItems: "center", gap: 6, userSelect: "none" }}
                >
                  <span
                    onTouchStart={e => touchSwap.onTouchStart(e, { area: "pool", index: pi }, p.name)}
                    style={{ fontSize: 14, color: "#2e3d50", padding: "6px 2px", touchAction: "none", cursor: "grab", lineHeight: 1 }}
                  >⠿</span>
                  <button
                    onClick={() => {
                      // Snabb-lägg till i första kedja med < 4 spelare, annars sista kedjan
                      const target = chains.findIndex(c => c.slots.length < 4);
                      addToChain(target >= 0 ? target : chains.length - 1, id);
                    }}
                    style={{ padding: "7px 14px", border: "1.5px solid " + pgc.color, borderRadius: 99, background: pgc.bg, color: pgc.color, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                  >
                    {p.name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
