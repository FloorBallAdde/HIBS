import { useState } from "react";
import { TODAY, FMT } from "../../lib/constants.js";

/**
 * ObservationModal — P9: Spelarobservationer
 *
 * Snabb tränarnotering per spelare, kopplat till datum.
 * Sparas i players.observations (JSONB array i Supabase).
 *
 * Schema-krav (kör en gång i Supabase SQL editor):
 *   ALTER TABLE players ADD COLUMN IF NOT EXISTS observations JSONB DEFAULT '[]';
 *
 * Observation-format: { id, text, date (YYYY-MM-DD), createdAt (ISO) }
 */
export default function ObservationModal({ player, onClose, onSave, profile }) {
  const [obs, setObs] = useState(() =>
    Array.isArray(player.observations) ? [...player.observations] : []
  );
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const persist = async (updated) => {
    setSaving(true);
    await onSave(updated);
    setSaving(false);
  };

  const addObs = async () => {
    if (!input.trim() || saving) return;
    const entry = {
      id: Date.now().toString(),
      text: input.trim(),
      date: TODAY(),
      createdAt: new Date().toISOString(),
      authorId: profile?.id || "",
      authorName: profile?.username || "Tränare",
    };
    const updated = [entry, ...obs];
    setObs(updated);
    setInput("");
    await persist(updated);
  };

  const deleteObs = async (id) => {
    const updated = obs.filter(o => o.id !== id);
    setObs(updated);
    await persist(updated);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addObs();
  };

  return (
    <div
      className="hibs-overlay"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", zIndex: 200 }}
      onClick={onClose}
    >
      <div
        className="hibs-sheet"
        style={{ width: "100%", background: "#111827", borderRadius: "20px 20px 0 0", padding: "20px 20px 40px", maxHeight: "82vh", overflowY: "auto", boxSizing: "border-box" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>👁 Observationer</div>
            <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>{player.name}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#4a5568", fontSize: 22, cursor: "pointer", padding: 4, lineHeight: 1, fontFamily: "inherit" }}
          >
            ✕
          </button>
        </div>

        {/* New observation input */}
        <div style={{ marginBottom: 20 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Observation... (ex: bra höger, tappar bollen under press, löper bra bakåt)"
            rows={3}
            autoFocus
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: "10px 12px",
              color: "#fff",
              fontSize: 13,
              fontFamily: "system-ui,sans-serif",
              resize: "none",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          <button
            onClick={addObs}
            disabled={!input.trim() || saving}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "12px 0",
              background: input.trim() ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.03)",
              border: "1px solid " + (input.trim() ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.07)"),
              borderRadius: 12,
              color: input.trim() ? "#38bdf8" : "#4a5568",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: input.trim() ? "pointer" : "default",
            }}
          >
            {saving ? "Sparar..." : "+ Lägg till observation"}
          </button>
          <div style={{ fontSize: 10, color: "#4a5568", textAlign: "right", marginTop: 4 }}>Ctrl+Enter för att spara snabbt</div>
        </div>

        {/* Observation list */}
        {obs.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#4a5568", fontSize: 13 }}>
            Inga observationer ännu. Börja anteckna ovan.
          </div>
        )}

        {obs.map(o => (
          <div
            key={o.id}
            style={{
              position: "relative",
              background: "rgba(56,189,248,0.04)",
              border: "1px solid rgba(56,189,248,0.12)",
              borderRadius: 12,
              padding: "10px 36px 10px 12px",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#4a5568" }}>{FMT(o.date)}</span>
              {o.authorName && (
                <span style={{ fontSize: 10, color: "#6366f1", fontWeight: 700 }}>· {o.authorName}</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.5 }}>{o.text}</div>
            {(!o.authorId || o.authorId === profile?.id) && (
              <button
                onClick={() => deleteObs(o.id)}
                title="Ta bort"
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "none",
                  border: "none",
                  color: "#4a5568",
                  fontSize: 13,
                  cursor: "pointer",
                  padding: "2px 4px",
                  lineHeight: 1,
                  fontFamily: "inherit",
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {obs.length > 0 && (
          <div style={{ fontSize: 10, color: "#4a5568", textAlign: "center", marginTop: 12 }}>
            {obs.length} observation{obs.length !== 1 ? "er" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
