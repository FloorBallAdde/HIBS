/**
 * TokenOverlay — interaktiva spelare/kon/boll-tokens ovanpå taktiktavlan.
 *
 * Extraherad från TaktiktavlaTab i Sprint 51 (samma mönster som
 * rinkDraw S50, ExerciseListItem S49, ChainCard S48, PlayerPool S47,
 * FilterChips S46, DrawingOverlay S44).
 *
 * Feature S51: ✕-radera-badge på tokens i select-läge förstorad till 22×22
 * (från 18×18) + role/aria-label/title för bättre tap-target och a11y vid
 * rinken. INTE 44×44 hit-area eftersom det skulle överlappa själva tokenet
 * (30×30 player) och "äta upp" drag-tryck i övre högra hörnet — vi behåller
 * samma overlap-mönster som originalet. ~50 % större träffyta än tidigare.
 *
 * Props:
 *   tokens          — [{ id, type:"player|cone|ball", xF, yF, num?, color? }]
 *   tool            — aktivt verktyg: "select" | "player" | "cone" | "ball" | "pen" | …
 *   onTokenDown     — (event, tokenId) => void  — start drag
 *   onTokenMove     — (event) => void           — pågående drag
 *   onTokenUp       — (event) => void           — drag klar
 *   onTokenDelete   — (tokenId) => void         — radera token (endast select-läge)
 */
export default function TokenOverlay({ tokens, tool, onTokenDown, onTokenMove, onTokenUp, onTokenDelete }) {
  // In select mode or placement modes: tokens are interactive (draggable)
  const isInteractive = tool === "player" || tool === "cone" || tool === "ball" || tool === "select";
  const showDelete    = tool === "select"; // show × badge in select mode

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {tokens.map(tok => {
        const base = {
          position: "absolute",
          left: `${tok.xF * 100}%`, top: `${tok.yF * 100}%`,
          transform: "translate(-50%, -50%)",
          touchAction: "none", userSelect: "none",
          pointerEvents: isInteractive ? "auto" : "none",
          cursor: isInteractive ? "grab" : "default",
          zIndex: 10,
        };
        const handlers = {
          onPointerDown: e => onTokenDown(e, tok.id),
          onPointerMove: onTokenMove,
          onPointerUp: onTokenUp,
          onPointerCancel: onTokenUp,
        };

        // Radera-badge i select-läge — 22×22 (från 18×18) för bättre tap-target
        // vid rinken. Same hörn-overlap som originalet → ingen drag-regression.
        const deleteBadge = showDelete && (
          <div
            onPointerDown={e => { e.stopPropagation(); onTokenDelete(tok.id); }}
            role="button"
            tabIndex={0}
            aria-label="Ta bort token"
            title="Ta bort"
            style={{
              position: "absolute", top: -11, right: -11,
              width: 22, height: 22, borderRadius: "50%",
              background: "#ef4444", border: "2px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 900, color: "#fff",
              cursor: "pointer", zIndex: 20, pointerEvents: "auto",
              lineHeight: 1,
              boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}>×</div>
        );

        if (tok.type === "player") {
          return (
            <div key={tok.id} {...handlers} style={{
              ...base, width: 30, height: 30, borderRadius: "50%",
              background: tok.color, border: "2.5px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: tok.num > 9 ? 10 : 12, fontWeight: 900, color: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
            }}>
              {tok.num}{deleteBadge}
            </div>
          );
        }
        if (tok.type === "cone") {
          return (
            <div key={tok.id} {...handlers} style={{
              ...base, width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
            }}>🔺{deleteBadge}</div>
          );
        }
        if (tok.type === "ball") {
          return (
            <div key={tok.id} {...handlers} style={{
              ...base, width: 28, height: 28, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #fff 0%, #f0e68c 50%, #daa520 100%)",
              border: "2px solid rgba(0,0,0,0.3)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(0,0,0,0.15)",
            }}>{deleteBadge}</div>
          );
        }
        return null;
      })}
    </div>
  );
}
