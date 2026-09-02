import { TODAY, FONT } from "../../lib/constants.js";

/**
 * TodayCard — dagsstyrt handlingskort överst på Hem (Sprint 70).
 * Match idag → stort kort som tar Andreas rakt in i matchflödet.
 * Renderar inget när dagen saknar match — Hem ska inte skrika i onödan.
 *
 * Props:
 *   upcomingMatches — [{ opponent, date, serie, rsvp? }]
 *   onGoMatch       — () => void (byter till Match-fliken)
 */
export default function TodayCard({ upcomingMatches, onGoMatch }) {
  const today = TODAY();
  const match = (upcomingMatches || []).find(m => m.date === today);
  if (!match) return null;

  const rsvpCount = Array.isArray(match.rsvp) ? match.rsvp.length : 0;

  return (
    <button
      onClick={onGoMatch}
      style={{
        width: "100%",
        padding: "18px 18px",
        marginBottom: 14,
        border: "1px solid rgba(34,197,94,0.4)",
        borderRadius: 18,
        background: "linear-gradient(135deg, rgba(34,197,94,0.16), rgba(22,163,74,0.06))",
        color: "#fff",
        fontFamily: "inherit",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <span style={{ fontSize: 26, flexShrink: 0 }}>🏑</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: FONT.label, fontWeight: 800, color: "#22c55e", marginBottom: 3 }}>MATCH IDAG</div>
        <div style={{ fontSize: FONT.title, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          vs {match.opponent}
        </div>
        <div style={{ fontSize: FONT.body, color: "#94a3b8", marginTop: 2 }}>
          {match.serie}{rsvpCount > 0 ? " · " + rsvpCount + " anmälda" : ""}
        </div>
      </div>
      <span style={{ flexShrink: 0, fontSize: FONT.body, fontWeight: 800, color: "#22c55e", background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: 99, padding: "9px 14px" }}>
        Ta ut laget ›
      </span>
    </button>
  );
}
