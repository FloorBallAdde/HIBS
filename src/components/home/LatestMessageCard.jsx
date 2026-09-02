import { useState, useEffect } from "react";
import { sbGet } from "../../lib/supabase.js";
import { FMT, FONT } from "../../lib/constants.js";

/**
 * LatestMessageCard — senaste lagmeddelandet direkt på Hem (Sprint 71).
 * Meddelanden låg tidigare enbart bakom Mer → Meddelanden; nu syns det
 * senaste alltid, med genväg till hela tråden. Renderar inget utan meddelanden.
 *
 * Props:
 *   clubId, tok    — Supabase-åtkomst
 *   onOpenMessages — () => void (öppnar Mer → Meddelanden)
 */
export default function LatestMessageCard({ clubId, tok, onOpenMessages }) {
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!clubId || !tok) return;
    sbGet("team_messages", "club_id=eq." + clubId + "&order=created_at.desc&limit=1", tok)
      .then(r => { if (Array.isArray(r) && r[0]) setMsg(r[0]); })
      .catch(() => {});
  }, [clubId, tok]);

  if (!msg) return null;

  return (
    <button
      onClick={onOpenMessages}
      style={{
        width: "100%",
        padding: "13px 16px",
        marginBottom: 14,
        border: "1px solid " + (msg.urgent ? "rgba(251,191,36,0.35)" : "rgba(255,255,255,0.07)"),
        borderRadius: 14,
        background: msg.urgent ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.03)",
        fontFamily: "inherit",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{msg.urgent ? "📣" : "💬"}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: FONT.label, fontWeight: 700, color: msg.urgent ? "#fbbf24" : "#64748b", marginBottom: 3 }}>
          {(msg.author_name || "Tränare").toUpperCase()} · {FMT(msg.created_at)}
        </div>
        <div style={{
          fontSize: FONT.body, color: "#cbd5e1", lineHeight: 1.45,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {msg.body}
        </div>
      </div>
      <span style={{ color: "#4a5568", fontSize: 16, flexShrink: 0 }}>›</span>
    </button>
  );
}
