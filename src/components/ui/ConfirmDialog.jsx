import { FONT } from "../../lib/constants.js";

/**
 * ConfirmDialog — appens enda bekräftelsedialog-mönster (Sprint 73).
 * Ersätter de olika inline-overlay-varianterna. Overlay-klick = avbryt.
 *
 * Props:
 *   title, body     — texter
 *   confirmLabel    — grön primärknapp (t.ex. "Starta ändå")
 *   cancelLabel     — sekundärknapp (t.ex. "Avbryt")
 *   onConfirm, onCancel
 *   danger          — true → röd primärknapp (destruktiva val)
 */
export default function ConfirmDialog({ title, body, confirmLabel, cancelLabel, onConfirm, onCancel, danger }) {
  return (
    <div
      onClick={onCancel}
      className="hibs-overlay"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="hibs-dialog"
        style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 360 }}
      >
        <div style={{ fontSize: FONT.title, fontWeight: 900, color: "#fff", marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: FONT.body, color: "#94a3b8", marginBottom: 20, lineHeight: 1.5 }}>{body}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "13px 0", minHeight: 44, border: "1px solid rgba(167,139,250,0.4)", borderRadius: 12, background: "rgba(167,139,250,0.08)", color: "#a78bfa", fontSize: FONT.body, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: "13px 0", minHeight: 44, border: "none", borderRadius: 12, background: danger ? "#f87171" : "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: FONT.body, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
