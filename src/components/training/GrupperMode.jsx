import { useState, useCallback } from "react";
import { GROUPS } from "../../lib/constants.js";
import { useTouchSwap } from "../../hooks/useTouchSwap.js";
import PlayerPool from "./PlayerPool.jsx";
import ChainCard from "./ChainCard.jsx";

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
  const [pickingChain, setPickingChain] = useState(null); // spelare-id som väntar på kedjeval

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

      {chains.map((chain, ci) => (
        <ChainCard
          key={ci}
          chain={chain}
          ci={ci}
          editName={editName}
          setEditName={setEditName}
          pById={pById}
          touchSwap={touchSwap}
          renameChain={renameChain}
          removeChain={removeChain}
          removeFromChain={removeFromChain}
        />
      ))}

      {/* Pool — spelare som inte tillhör någon kedja */}
      <PlayerPool
        pool={pool}
        pById={pById}
        chains={chains}
        touchSwap={touchSwap}
        pickingChain={pickingChain}
        setPickingChain={setPickingChain}
        addToChain={addToChain}
      />
    </div>
  );
}
