import { useState } from "react";
import { FONT } from "../../lib/constants.js";
import { sbPost } from "../../lib/supabase.js";
import { useApp } from "../../lib/AppContext.jsx";

/**
 * QuickNoteSheet — snabbanteckning från VAR SOM HELST i appen (Sprint 76).
 * Öppnas via 🧠-knappen i AppHeader. Sparas i training_notes (delad mellan
 * tränarna) och dyker upp som bensin i Träning → Planera + på Hem.
 * Superenkelt: skriv → Spara. Klart.
 *
 * Props:
 *   onSaved — (savedNote) => void (uppdaterar App-state)
 *   onClose — () => void
 */
export default function QuickNoteSheet({ onSaved, onClose }) {
  const { clubId, uid, tok } = useApp();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const t = text.trim();
    if (!t) return;
    setSaving(true);
    try {
      const r = await sbPost("training_notes", { club_id: clubId, text: t, created_by: uid }, tok);
      const saved = Array.isArray(r) && r[0] ? r[0] : { id: Date.now(), text: t };
      onSaved(saved);
    } catch (_) {
      onSaved({ id: Date.now(), text: t });
    }
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="hibs-overlay"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 210, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "80px 20px 20px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="hibs-dialog"
        style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 20, width: "100%", maxWidth: 400 }}
      >
        <div style={{ fontSize: FONT.title, fontWeight: 900, color: "#fff", marginBottom: 4 }}>Snabbanteckning 🧠</div>
        <div style={{ fontSize: FONT.label, color: "#64748b", marginBottom: 12 }}>
          Delas med tränarna · blir bensin i Planera
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
          rows={4}
          placeholder="T.ex. Statiskt uppspel — öva rakare spel upp på 2:an"
          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 16, lineHeight: 1.5, padding: "12px 14px", fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 12 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "13px 0", minHeight: 44, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "transparent", color: "#64748b", fontSize: FONT.body, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
          >
            Avbryt
          </button>
          <button
            onClick={save}
            disabled={saving || !text.trim()}
            style={{ flex: 2, padding: "13px 0", minHeight: 44, border: "none", borderRadius: 12, background: text.trim() ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(255,255,255,0.05)", color: text.trim() ? "#fff" : "#475569", fontSize: FONT.body, fontWeight: 800, fontFamily: "inherit", cursor: text.trim() ? "pointer" : "not-allowed" }}
          >
            {saving ? "Sparar..." : "Spara"}
          </button>
        </div>
      </div>
    </div>
  );
}
