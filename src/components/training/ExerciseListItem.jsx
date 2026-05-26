import { CAT_COLOR, intensityColor } from "../../lib/constants.js";

/**
 * Presentational kort för en övning i OvningarTab-listan.
 *
 * En övning per rad — kategoribadge, namn, "vad"-beskrivning till vänster;
 * spelar-antal, intensitet, drawing-indikator (🎨) och favorit-stjärna till höger.
 * Hela kortet är klickbart (öppnar detail-sheet); favorit-stjärnan stoppar
 * event-propagation så att en tap på stjärnan inte också öppnar sheet:et.
 *
 * Props:
 *   ex         — exercise-objekt ({ id, name, category, intensity, players, vad, has_drawing })
 *   isFav      — boolean, om denna övning ligger i favorit-Set
 *   onSelect   — () => void, anropas när kortet tappas (öppna detail-sheet)
 *   onToggleFav — (event, id) => void, togglar favorit (stoppar event-propagation själv)
 *
 * Extraherad från OvningarTab.jsx i Sprint 49 — paritet med ChainCard (S48),
 * PlayerPool (S47), FilterChips (S46). Inga stilförändringar mot tidigare inline-version.
 */
export default function ExerciseListItem({ ex, isFav, onSelect, onToggleFav }) {
  const cc = CAT_COLOR[ex.category] || "#64748b";
  return (
    <div onClick={onSelect}
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 8, cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: cc, background: cc + "15", border: "1px solid " + cc + "25", borderRadius: 99, padding: "2px 8px" }}>{ex.category}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{ex.name}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>{ex.vad}</div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          {ex.players && <div style={{ fontSize: 11, color: "#4a5568" }}>{ex.players} sp</div>}
          <div style={{ fontSize: 11, color: intensityColor(ex.intensity) }}>{ex.intensity}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {ex.has_drawing && (
              <span title="Har taktiktavla-ritning" aria-label="Har ritning"
                style={{ fontSize: 13, lineHeight: 1, opacity: 0.85 }}>🎨</span>
            )}
            <button onClick={e => onToggleFav(e, ex.id)}
              title={isFav ? "Ta bort från favoriter" : "Spara som favorit"}
              aria-label={isFav ? "Ta bort " + ex.name + " från favoriter" : "Spara " + ex.name + " som favorit"}
              aria-pressed={isFav}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 0, minHeight: 44, minWidth: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", color: isFav ? "#fbbf24" : "#4a5568" }}>
              {isFav ? "★" : "☆"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
