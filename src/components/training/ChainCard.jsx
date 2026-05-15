import { GC, gc, CHAIN_POS, CHAIN_COL } from "../../lib/constants.js";

/**
 * ChainCard — en kedja i GrupperMode med header, slots och drop-zon.
 *
 * Extraherad från GrupperMode i Sprint 48 (samma mönster som
 * PlayerPool S47, FilterChips S46, DrawingOverlay S44).
 *
 * Feature S48: ✕-knappar (radera kedja, ta bort spelare från kedja)
 * fick 44×44 touch-target + aria-label/title — samma a11y-paritet som
 * filter-chips (S46) och favorite-toggle (S47).
 *
 * Props:
 *   chain            — { name, groupId, slots[] }
 *   ci               — kedjans index
 *   editName         — index på kedja som redigeras, eller null
 *   setEditName      — setter
 *   pById            — (id) => player-objekt
 *   touchSwap        — { onTouchStart, onTouchMove, onTouchEnd }
 *   renameChain      — (ci, name) => void
 *   removeChain      — (ci) => void
 *   removeFromChain  — (ci, slotIdx) => void
 */
export default function ChainCard({
  chain,
  ci,
  editName,
  setEditName,
  pById,
  touchSwap,
  renameChain,
  removeChain,
  removeFromChain,
}) {
  const gColor = chain.groupId ? GC[chain.groupId]?.color : "#a78bfa";

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, marginBottom: 14, overflow: "hidden" }}>
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
            aria-label={"Byt namn på " + chain.name}
            style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 8px", fontFamily: "inherit", outline: "none", flex: 1 }}
          />
        ) : (
          <span onClick={() => setEditName(ci)} style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", cursor: "pointer", flex: 1 }}>{chain.name}</span>
        )}
        <span style={{ fontSize: 10, color: "#4a5568" }}>{chain.slots.length} spelare</span>
        <button
          onClick={() => removeChain(ci)}
          title={"Ta bort " + chain.name}
          aria-label={"Ta bort " + chain.name}
          style={{ fontSize: 14, color: "#4a5568", background: "none", border: "none", cursor: "pointer", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontFamily: "inherit" }}
        >✕</button>
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
              <button
                onClick={() => removeFromChain(ci, pi)}
                title={"Ta bort " + p.name + " ur kedjan"}
                aria-label={"Ta bort " + p.name + " ur " + chain.name}
                style={{ fontSize: 13, color: "#4a5568", background: "none", border: "none", cursor: "pointer", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontFamily: "inherit", flexShrink: 0 }}
              >✕</button>
            </div>
          );
        })}
      </div>

      {/* Drop-zon — alltid synlig så att spelare kan dras hit från andra kedjor */}
      <div
        data-swap-slot={JSON.stringify({ area: ci, index: chain.slots.length })}
        onTouchMove={touchSwap.onTouchMove}
        onTouchEnd={touchSwap.onTouchEnd}
        style={{
          padding: chain.slots.length === 0 ? "20px 16px" : "8px 16px",
          textAlign: "center",
          fontSize: 11,
          color: "#2e3d50",
          borderTop: chain.slots.length > 0 ? "1px dashed rgba(255,255,255,0.06)" : "none",
        }}
      >
        {chain.slots.length === 0 ? "Dra spelare hit eller tryck i poolen nedan" : "+ dra hit"}
      </div>
    </div>
  );
}
