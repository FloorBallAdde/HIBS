// src/components/mer/FeedbackTrend.jsx
// Sprint 28: UX-dashboard — visa feedback-trend för de senaste 10 app_feedback-rader
import { useState, useEffect } from "react";
import { sbGet } from "../../lib/supabase.js";

export default function FeedbackTrend({ clubId, tok }) {
  const [rows, setRows] = useState(null); // null = laddar, [] = ingen data

  useEffect(() => {
    if (!clubId || !tok) return;
    sbGet(
      "app_feedback",
      "club_id=eq." + clubId + "&order=created_at.desc&limit=10",
      tok
    )
      .then(r => setRows(Array.isArray(r) ? r : []))
      .catch(() => setRows([]));
  }, [clubId, tok]);

  // Visa inget tills data finns och minst ett svar har loggats
  if (!rows || rows.length === 0) return null;

  const ups = rows.filter(r => r.rating === "up").length;
  const pct = Math.round((ups / rows.length) * 100);
  const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#fbbf24" : "#f87171";
  const emoji = pct >= 70 ? "👍" : pct >= 40 ? "😐" : "👎";

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "12px 16px",
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{emoji}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, color: "#4a5568", fontWeight: 700, marginBottom: 6 }}>
          APP-UPPLEVELSE · SENASTE {rows.length} MATCHER
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            flex: 1,
            height: 6,
            borderRadius: 99,
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}>
            <div style={{
              width: pct + "%",
              height: "100%",
              background: color,
              borderRadius: 99,
              transition: "width 0.4s ease",
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color, flexShrink: 0 }}>{pct}%</span>
        </div>
      </div>
    </div>
  );
}
