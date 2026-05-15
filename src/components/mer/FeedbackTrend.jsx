// src/components/mer/FeedbackTrend.jsx
// Sprint 28: UX-dashboard — visa feedback-trend för de senaste 10 app_feedback-rader
// Sprint 38: expanderbar per-tränare-uppdelning när ≥2 unika tränare har loggat
import { useState, useEffect, useMemo } from "react";
import { sbGet } from "../../lib/supabase.js";

export default function FeedbackTrend({ clubId, tok, coaches = [] }) {
  const [rows, setRows] = useState(null); // null = laddar, [] = ingen data
  const [expanded, setExpanded] = useState(false);

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

  // uid → namn-mapping. Fallback till uid-kort om namn saknas.
  const nameFor = useMemo(() => {
    const map = {};
    (coaches || []).forEach(c => { if (c?.id) map[c.id] = c.username || c.name || c.id.slice(0, 6); });
    return map;
  }, [coaches]);

  // Gruppera rows per uid (bara om feedback har uid)
  const perCoach = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    const groups = {};
    rows.forEach(r => {
      const uid = r.uid || "okänd";
      if (!groups[uid]) groups[uid] = { uid, ups: 0, total: 0 };
      groups[uid].total++;
      if (r.rating === "up") groups[uid].ups++;
    });
    return Object.values(groups)
      .map(g => ({ ...g, pct: Math.round((g.ups / g.total) * 100), name: nameFor[g.uid] || "Okänd tränare" }))
      .sort((a, b) => b.total - a.total);
  }, [rows, nameFor]);

  // Visa inget tills data finns och minst ett svar har loggats
  if (!rows || rows.length === 0) return null;

  const ups = rows.filter(r => r.rating === "up").length;
  const pct = Math.round((ups / rows.length) * 100);
  const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#fbbf24" : "#f87171";
  const emoji = pct >= 70 ? "👍" : pct >= 40 ? "😐" : "👎";
  const showBreakdown = perCoach.length >= 2;

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "12px 16px",
      marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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

      {/* Per-tränare-uppdelning: visas bara om ≥2 tränare har loggat */}
      {showBreakdown && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              marginTop: 10,
              width: "100%",
              minHeight: 44,
              background: "none",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              color: "#94a3b8",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.05em",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span>PER TRÄNARE ({perCoach.length})</span>
            <span style={{ fontSize: 10, opacity: 0.8 }}>{expanded ? "▴" : "▾"}</span>
          </button>

          {expanded && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {perCoach.map(c => {
                const cColor = c.pct >= 70 ? "#22c55e" : c.pct >= 40 ? "#fbbf24" : "#f87171";
                return (
                  <div key={c.uid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: "0 0 auto", minWidth: 80, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, color: "#cbd5e1", fontWeight: 700 }}>
                      {c.name}
                    </div>
                    <div style={{ flex: 1, height: 5, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ width: c.pct + "%", height: "100%", background: cColor, borderRadius: 99, transition: "width 0.4s ease" }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0, minWidth: 28, textAlign: "right" }}>
                      {c.total}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: cColor, flexShrink: 0, minWidth: 36, textAlign: "right" }}>
                      {c.pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
