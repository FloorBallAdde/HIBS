import { gc } from "../../lib/constants.js";

/**
 * MatchRsvpModal — Spelaranmälan per kommande match.
 * Tränaren bockar i vilka spelare som är tillgängliga.
 * Sparas direkt i Supabase (via onToggle callback).
 */
export default function MatchRsvpModal({ match, players, onToggle, onClose }) {
  const rsvp = Array.isArray(match?.rsvp) ? match.rsvp : [];
  const field = players.filter(p => p.role !== "malvakt");
  const keepers = players.filter(p => p.role === "malvakt");

  const handleTap = (id) => {
    const next = rsvp.includes(id)
      ? rsvp.filter(x => x !== id)
      : [...rsvp, id];
    onToggle(match.id, next);
  };

  const PlayerRow = ({ p }) => {
    const on = rsvp.includes(p.id);
    const pgc = gc(p.group);
    return (
      <button
        onClick={() => handleTap(p.id)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          width: "100%", padding: "12px 14px",
          background: on ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
          border: "1px solid " + (on ? "rgba(34,197,94,0.28)" : "rgba(255,255,255,0.06)"),
          borderRadius: 12, marginBottom: 6,
          cursor: "pointer", textAlign: "left", fontFamily: "inherit",
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: pgc.color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: on ? "#e2e8f0" : "#64748b" }}>
          {p.name}
        </span>
        {p.note?.startsWith("⚠") && (
          <span style={{ fontSize: 11, color: "#f87171" }}>⚠</span>
        )}
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: on ? "#22c55e" : "rgba(255,255,255,0.04)",
          border: "1.5px solid " + (on ? "#22c55e" : "rgba(255,255,255,0.1)"),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: on ? "#fff" : "transparent",
          flexShrink: 0,
        }}>✓</div>
      </button>
    );
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 300, display: "flex", alignItems: "flex-end" }}
    >
      <div style={{ width: "100%", background: "#131620", borderRadius: "20px 20px 0 0", padding: "20px 16px 36px", maxHeight: "88vh", overflowY: "auto", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Spelaranmälan</div>
            <div style={{ fontSize: 12, color: "#4a5568", marginTop: 3 }}>
              vs <span style={{ color: "#94a3b8", fontWeight: 700 }}>{match?.opponent}</span>
              {" · "}
              <span style={{ color: "#22c55e", fontWeight: 700 }}>{rsvp.length}</span> anmälda av {players.length}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4a5568", fontSize: 24, cursor: "pointer", padding: 0, lineHeight: 1, marginTop: -2 }}>×</button>
        </div>

        {/* Goalkeepers */}
        {keepers.length > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#4a5568", marginBottom: 8, letterSpacing: "0.1em" }}>MÅLVAKTER</div>
            {keepers.map(p => <PlayerRow key={p.id} p={p} />)}
            <div style={{ height: 12 }} />
          </>
        )}

        {/* Field players */}
        <div style={{ fontSize: 10, fontWeight: 800, color: "#4a5568", marginBottom: 8, letterSpacing: "0.1em" }}>UTESPELARE</div>
        {field.map(p => <PlayerRow key={p.id} p={p} />)}

        {/* Footer tip */}
        {rsvp.length > 0 && (
          <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: "#4ade80" }}>
              💡 Starta matchen från schemat — de {rsvp.length} anmälda väljs automatiskt i truppen.
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{ marginTop: 16, width: "100%", padding: "14px 0", border: "none", borderRadius: 14, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 14, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}
        >
          Klar{rsvp.length > 0 ? ` · ${rsvp.length} anmälda` : ""}
        </button>
      </div>
    </div>
  );
}
