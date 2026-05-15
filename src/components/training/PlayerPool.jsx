import { gc } from "../../lib/constants.js";

/**
 * PlayerPool — visar spelare som inte tillhör någon kedja.
 * Touch drag: ⠿-handtag startar swap. Tryck på spelar-knappen → kedjepicker.
 *
 * Extraherad från GrupperMode i Sprint 47.
 *
 * Props:
 *   pool          — array av player-id i poolen
 *   pById         — (id) => player-objekt
 *   chains        — array av kedjor (för kedjepicker)
 *   touchSwap     — { onTouchStart, onTouchMove, onTouchEnd } från useTouchSwap
 *   pickingChain  — spelar-id som väntar på kedjeval (eller null)
 *   setPickingChain — setter
 *   addToChain    — (ci, playerId) => void
 */
export default function PlayerPool({ pool, pById, chains, touchSwap, pickingChain, setPickingChain, addToChain }) {
  if (pool.length === 0) return null;

  return (
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
              {pickingChain === id ? (
                // Kedjepicker: välj vilken kedja spelaren ska till
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700 }}>{p.name} →</span>
                  {chains.map((c, ci) => (
                    <button
                      key={ci}
                      onClick={() => { addToChain(ci, id); setPickingChain(null); }}
                      style={{ padding: "5px 10px", border: "1.5px solid #a78bfa", borderRadius: 99, background: "rgba(167,139,250,0.12)", color: "#a78bfa", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                    >{ci + 1}</button>
                  ))}
                  <button onClick={() => setPickingChain(null)} style={{ padding: "5px 8px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 99, background: "transparent", color: "#4a5568", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>✕</button>
                </div>
              ) : (
                <button
                  onClick={() => setPickingChain(id)}
                  style={{ padding: "7px 14px", border: "1.5px solid " + pgc.color, borderRadius: 99, background: pgc.bg, color: pgc.color, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                >
                  {p.name}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
