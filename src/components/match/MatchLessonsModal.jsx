import { useState } from "react";
import { FONT } from "../../lib/constants.js";
import { sbPatch } from "../../lib/supabase.js";
import { useApp } from "../../lib/AppContext.jsx";

/**
 * MatchLessonsModal — "Vad såg du?" direkt efter avslutad match (Sprint 75).
 * Korta observationer medan de är färska — sparas i matchens note-fält
 * (befintlig DB-kolumn) och dyker upp som "Bensin från senaste matchen"
 * i Träning → Planera. Helt valfritt — Hoppa över är alltid ett tryck bort.
 *
 * Props:
 *   match   — den nyss sparade matchen (history[0])
 *   setHistory — uppdaterar lokala historiken
 *   onClose — stänger modalen (går vidare till ev. feedback-overlay)
 */
export default function MatchLessonsModal({ match, setHistory, onClose }) {
  const { tok } = useApp();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const t = text.trim();
    if (!t || !match?.id) { onClose(); return; }
    setSaving(true);
    // Bevara ev. befintlig note — lärdomarna läggs till, skriver aldrig över
    const merged = match.note ? match.note + "\n\n" + t : t;
    try { await sbPatch("matches", match.id, { note: merged }, tok); } catch (_) {}
    setHistory(p => p.map(m => m.id === match.id ? { ...m, note: merged } : m));
    onClose();
  };

  return (
    <div
      className="hibs-overlay"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 210, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        className="hibs-dialog"
        style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 400 }}
      >
        <div style={{ fontSize: FONT.title, fontWeight: 900, color: "#fff", marginBottom: 4 }}>Vad såg du? 🧠</div>
        <div style={{ fontSize: FONT.body, color: "#94a3b8", marginBottom: 14, lineHeight: 1.5 }}>
          Korta observationer från matchen — blir bensin när ni planerar nästa träning.
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
          rows={6}
          placeholder={"T.ex. Statiskt uppspel — öva rakare spel upp på 2:an.\nOklart vem som styr markeringarna."}
          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: FONT.body, lineHeight: 1.5, padding: "12px 14px", fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 14 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "13px 0", minHeight: 44, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "transparent", color: "#64748b", fontSize: FONT.body, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
          >
            Hoppa över
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{ flex: 2, padding: "13px 0", minHeight: 44, border: "none", borderRadius: 12, background: text.trim() ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(255,255,255,0.05)", color: text.trim() ? "#fff" : "#475569", fontSize: FONT.body, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}
          >
            {saving ? "Sparar..." : "Spara lärdomar"}
          </button>
        </div>
      </div>
    </div>
  );
}
