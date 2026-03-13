/**
 * MatchNoteModal — Noteringsmodal för en avslutad/pågående match.
 * Extraherad från App.jsx i Sprint 6 (samma mönster som NoteModal/GoalModal).
 */
export default function MatchNoteModal({ match, onClose, onSave }) {
  if (!match) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#161926", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px 20px 0 0", padding: "24px 20px 40px",
          width: "100%", maxWidth: 430,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 14 }}>
          Notering - vs {match.opponent}
        </div>
        <textarea
          defaultValue={match.note || ""}
          id="match-note-area"
          placeholder="T.ex. bra press, jobbig domare..."
          style={{
            width: "100%", minHeight: 80,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, color: "#fff", fontSize: 14, padding: 12,
            fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "12px 0", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, background: "transparent", color: "#4a5568",
              fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
            }}
          >
            Avbryt
          </button>
          <button
            onClick={() => {
              const txt = document.getElementById("match-note-area").value;
              onSave(txt);
            }}
            style={{
              flex: 1, padding: "12px 0", border: "none", borderRadius: 12,
              background: "#a78bfa", color: "#fff",
              fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
            }}
          >
            Spara
          </button>
        </div>
      </div>
    </div>
  );
}
