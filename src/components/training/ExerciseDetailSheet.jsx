import { CAT_COLOR, CAT_DESC } from "../../lib/constants.js";

/* ─── Split hur-text into numbered steps (split on newlines) ─── */
const splitSteps = (text) =>
  text.split(/\n+/).map(s => s.trim()).filter(Boolean);

/**
 * ExerciseDetailSheet — Detaljvy för en övning (bottom sheet).
 * Extraherad från OvningarTab i Sprint 33.
 *
 * Props:
 *   sel        — vald övning (objekt)
 *   onClose    — stäng sheeten
 *   onEdit     — öppna redigeringsvy
 *   onDraw     — öppna taktiktavla
 *   favorites  — Set med favorit-ID:n
 *   toggleFav  — (e, id) => void
 */
export default function ExerciseDetailSheet({ sel, onClose, onEdit, onDraw, favorites, toggleFav }) {
  if (!sel) return null;

  const cc = CAT_COLOR[sel.category] || "#64748b";
  const isFav = favorites.has(sel.id);
  const hasDrawing = !!sel.canvas_drawing;

  return (
    <div onClick={onClose} className="hibs-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} className="hibs-sheet" style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", width: "100%", maxWidth: 430, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, color: cc, background: cc + "18", border: "1px solid " + cc + "30", borderRadius: 99, padding: "3px 10px" }}>{sel.category}</span>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginTop: 8 }}>{sel.name}</div>
            {CAT_DESC[sel.category] && (
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, lineHeight: 1.4, fontStyle: "italic" }}>{CAT_DESC[sel.category]}</div>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {sel.players && <div style={{ fontSize: 11, color: "#4a5568" }}>{sel.players} sp</div>}
            <div style={{ fontSize: 11, color: sel.intensity === "Hög" ? "#f87171" : sel.intensity === "Medel" ? "#fbbf24" : "#34d399" }}>{sel.intensity}</div>
            <button onClick={e => toggleFav(e, sel.id)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "2px 0", color: isFav ? "#fbbf24" : "#4a5568" }}>
              {isFav ? "★" : "☆"}
            </button>
          </div>
        </div>

        {/* Taktiktavla */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700 }}>TAKTIKTAVLA</div>
            <button onClick={() => onDraw(sel.id)}
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8, color: "#22c55e", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", padding: "4px 10px" }}>
              {hasDrawing ? "✏️ Redigera" : "🎨 Rita"}
            </button>
          </div>
          {hasDrawing ? (
            <img src={sel.canvas_drawing} alt="Taktiktavla"
              style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", display: "block" }} />
          ) : (
            <div onClick={() => onDraw(sel.id)}
              style={{ background: "rgba(239,68,68,0.05)", border: "1.5px dashed rgba(239,68,68,0.3)", borderRadius: 12, padding: "22px 16px", textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🎨</div>
              <div style={{ fontSize: 12, color: "#f87171", fontWeight: 700 }}>Ritning saknas</div>
              <div style={{ fontSize: 11, color: "#4a5568", marginTop: 4 }}>Tryck för att rita på tavlan</div>
            </div>
          )}
        </div>

        {[["VAD", sel.vad], ["VARFÖR", sel.varfor]].filter(([, t]) => t).map(([l, t]) => (
          <div key={l} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{t}</div>
          </div>
        ))}
        {sel.hur && (() => {
          const steps = splitSteps(sel.hur);
          return (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 6 }}>HUR</div>
              {steps.length > 1
                ? steps.map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: "rgba(34,197,94,0.15)", border: "1.5px solid rgba(34,197,94,0.3)",
                        color: "#22c55e", fontSize: 11, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, marginTop: 1,
                      }}>{i + 1}</div>
                      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{step}</div>
                    </div>
                  ))
                : <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{sel.hur}</div>
              }
            </div>
          );
        })()}

        {sel.organisation && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 4 }}>ORGANISATION</div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{sel.organisation}</div>
          </div>
        )}
        {(sel.tips || []).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 6 }}>TIPS</div>
            {sel.tips.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", marginTop: 5, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#94a3b8" }}>{t}</span>
              </div>
            ))}
          </div>
        )}

        {(sel.coaching_fragor || []).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 6 }}>COACHINGFRÅGOR</div>
            {sel.coaching_fragor.map((t, i) => (
              <div key={i} style={{ fontSize: 13, color: "#38bdf8", marginBottom: 4 }}>- {t}</div>
            ))}
          </div>
        )}

        <button
          onClick={() => onEdit(sel)}
          style={{ width: "100%", padding: "12px 0", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 12, background: "rgba(167,139,250,0.06)", color: "#a78bfa", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginBottom: 8 }}>
          ✏️ Redigera övning
        </button>
        <button onClick={onClose}
          style={{ width: "100%", padding: "12px 0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "transparent", color: "#4a5568", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
          Stäng
        </button>
      </div>
    </div>
  );
}
