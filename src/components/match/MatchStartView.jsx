import { FMT, FONT, serieColor } from "../../lib/constants.js";

/**
 * MatchStartView — landningsvyn för Match-fliken (Sprint 69).
 * Ett beslut, inte ett formulär: schemalagda matcher som stora kort,
 * en stor "+ Ny match"-knapp, och cup-fortsättning när cup-läget är aktivt.
 *
 * Props:
 *   upcomingMatches — [{ id, opponent, date, serie, rsvp? }]
 *   cupMode         — bool
 *   onSchedule      — (match) => void  (förifyller + hoppar till Trupp)
 *   onNew           — () => void       (tomt flöde, steg 1 Match)
 *   onCupContinue   — () => void       (direkt till Kedjor — trupp sparad)
 */
export default function MatchStartView({ upcomingMatches, cupMode, onSchedule, onNew, onCupContinue }) {

  return (
    <div>
      <div style={{ fontSize: FONT.title, fontWeight: 900, color: "#fff", marginBottom: 14 }}>Match</div>

      {/* Cup-läge aktivt: fortsätt direkt till kedjor */}
      {cupMode && (
        <button
          onClick={onCupContinue}
          style={{
            width: "100%", padding: "16px 18px", marginBottom: 12,
            border: "1px solid rgba(251,191,36,0.35)", borderRadius: 16,
            background: "rgba(251,191,36,0.08)", color: "#fbbf24",
            fontSize: 14, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
            textAlign: "left", display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>🏆</span>
          <span>
            Fortsätt cupen — trupp sparad
            <span style={{ display: "block", fontSize: FONT.label, fontWeight: 600, opacity: 0.7, marginTop: 2 }}>Direkt till kedjor för nästa match</span>
          </span>
        </button>
      )}

      {/* Schemalagda matcher som stora kort */}
      {upcomingMatches && upcomingMatches.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: FONT.label, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>FRÅN SCHEMAT — TRYCK FÖR ATT STARTA</div>
          {/* Sprint 77: visa bara de 5 närmaste — hela säsongen ligger i schemat */}
          {upcomingMatches.slice(0, 5).map(m => {
            const sc = serieColor(m.serie);
            const rsvpCount = Array.isArray(m.rsvp) ? m.rsvp.length : 0;
            return (
              <button
                key={m.id}
                onClick={() => onSchedule(m)}
                style={{
                  width: "100%", padding: "16px 18px", marginBottom: 8,
                  border: "1px solid " + sc + "40", borderRadius: 16,
                  background: sc + "0d", color: "#fff",
                  fontFamily: "inherit", cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: FONT.title, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>vs {m.opponent}</div>
                  <div style={{ fontSize: FONT.body, color: "#94a3b8", marginTop: 3 }}>
                    {FMT(m.date)}{m.time ? " " + m.time : ""}{m.venue ? " · " + m.venue : ""}
                    {rsvpCount > 0 && <span style={{ color: "#22c55e" }}> · {rsvpCount} anmälda</span>}
                  </div>
                </div>
                <span style={{ fontSize: FONT.label, fontWeight: 800, color: sc, background: sc + "18", border: "1px solid " + sc + "40", borderRadius: 99, padding: "4px 10px", flexShrink: 0 }}>{m.serie}</span>
                <span style={{ color: sc, fontSize: 18, flexShrink: 0 }}>›</span>
              </button>
            );
          })}
          {upcomingMatches.length > 5 && (
            <div style={{ fontSize: FONT.label, color: "#475569", textAlign: "center", padding: "2px 0 4px" }}>
              + {upcomingMatches.length - 5} matcher till i säsongen
            </div>
          )}
        </div>
      )}

      {/* Ny match */}
      <button
        onClick={onNew}
        style={{
          width: "100%", padding: "18px 0",
          border: "none", borderRadius: 16,
          background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff",
          fontSize: FONT.title, fontWeight: 900, fontFamily: "inherit", cursor: "pointer",
        }}
      >
        + Ny match
      </button>
    </div>
  );
}
