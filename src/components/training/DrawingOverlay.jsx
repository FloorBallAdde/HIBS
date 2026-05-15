import { CAT_COLOR, intensityColor } from "../../lib/constants.js";
import TaktiktavlaTab from "./TaktiktavlaTab.jsx";

/**
 * DrawingOverlay — helskärms-canvas när tränaren ritar taktik på en övning.
 * Extraherad från OvningarTab i Sprint 44 (samma mönster som ExerciseDetailSheet S33,
 * CreateExerciseForm S34, SeasonRecordHero S38, LatestMatchCard S39, QuickStatsStrip S40,
 * FormStrip S41, TopScorers S42, LatestTrainings S43).
 *
 * Sprint 44 feature: Contextual metadata-rad i headern visar nu kategori-badge + intensitet.
 * Vid rinken: berättar omedelbart vilken typ av övning man ritar för (färg + label) och
 * hur intensiv den är, så Andreas kan tänka rätt taktiska element utan att backa till listan.
 *
 * Props:
 *   exercise — vald övning (objekt med id, name, category, intensity)
 *   onSave   — (dataURL) => void
 *   onCancel — () => void
 *   saving   — boolean: visar "Sparar ritning..."-overlay
 */
export default function DrawingOverlay({ exercise, onSave, onCancel, saving }) {
  if (!exercise) return null;

  const cc = CAT_COLOR[exercise.category] || "#64748b";
  const intCol = intensityColor(exercise.intensity);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "#0d1117", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 14px", background: "#111827", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700 }}>TAKTIKTAVLA FÖR</div>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginTop: 2 }}>{exercise.name}</div>
        {(exercise.category || exercise.intensity) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            {exercise.category && (
              <span
                title={"Kategori: " + exercise.category}
                aria-label={"Kategori " + exercise.category}
                style={{
                  fontSize: 10, fontWeight: 800, color: cc,
                  background: cc + "15", border: "1px solid " + cc + "25",
                  borderRadius: 99, padding: "2px 8px",
                  letterSpacing: "0.04em",
                }}
              >
                {exercise.category}
              </span>
            )}
            {exercise.intensity && (
              <span
                title={"Intensitet: " + exercise.intensity}
                aria-label={"Intensitet " + exercise.intensity}
                style={{
                  fontSize: 10, fontWeight: 700, color: intCol,
                  letterSpacing: "0.04em",
                }}
              >
                {exercise.intensity.toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <TaktiktavlaTab onSave={onSave} onCancel={onCancel} />
      </div>
      {saving && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
          <div style={{ color: "#22c55e", fontSize: 16, fontWeight: 800 }}>Sparar ritning...</div>
        </div>
      )}
    </div>
  );
}
