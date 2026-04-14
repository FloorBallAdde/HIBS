import { useState, useEffect, useCallback } from "react";
import { sbGet } from "../../lib/supabase.js";
import { FMT } from "../../lib/constants.js";

/**
 * ParentView — Förenklad vy för föräldrar (P11 Fas 2, Steg 1).
 * Sprint 33: Läsvy med lagmeddelanden + kommande matcher.
 * Ingen redigering, inga tränartabs — bara den info en förälder behöver vid rinken.
 *
 * Props:
 *   profile   — användarens profil (med club_id, clubs.name, username)
 *   auth      — { tok, uid }
 *   onSignOut — logga ut-callback
 */
export default function ParentView({ profile, auth, onSignOut }) {
  const [messages, setMessages] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  const clubId = profile?.club_id;
  const tok = auth?.tok;
  const teamName = profile?.clubs?.name || "Laget";

  // Ladda meddelanden + kommande matcher
  const loadData = useCallback(async () => {
    if (!clubId || !tok) return;
    try {
      const [msgs, matches] = await Promise.all([
        sbGet("team_messages", "club_id=eq." + clubId + "&order=created_at.desc&limit=30", tok),
        sbGet("matches", "club_id=eq." + clubId + "&is_upcoming=eq.true&order=date.asc", tok),
      ]);
      if (Array.isArray(msgs)) setMessages(msgs);
      if (Array.isArray(matches)) setUpcoming(matches);
    } catch (e) {
      console.error("ParentView load:", e);
    }
    setLoading(false);
  }, [clubId, tok]);

  useEffect(() => { loadData(); }, [loadData]);

  // Polling var 30s — nya meddelanden visas snabbt
  useEffect(() => {
    if (!clubId || !tok) return;
    const id = setInterval(loadData, 30_000);
    return () => clearInterval(id);
  }, [clubId, tok, loadData]);

  // Formatera tid (samma som TeamMessages)
  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60_000);
    if (diffMin < 1) return "Nu";
    if (diffMin < 60) return diffMin + " min sedan";
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return diffH + "h sedan";
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return diffD + "d sedan";
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  };

  // Nästa match
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const nextMatch = upcoming.find(m => new Date(m.date) >= today);
  const daysUntil = nextMatch ? Math.ceil((new Date(nextMatch.date) - today) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#0b0d14", fontFamily: "system-ui,sans-serif", color: "#fff" }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{
        padding: "20px 16px 16px",
        background: "linear-gradient(180deg, rgba(34,197,94,0.06) 0%, transparent 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "#4a5568", fontWeight: 700, letterSpacing: 1 }}>FÖRÄLDRAVY</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginTop: 2 }}>{teamName}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              Inloggad som {profile?.username || "Förälder"}
            </div>
          </div>
          <button
            onClick={onSignOut}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              color: "#64748b",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Logga ut
          </button>
        </div>
      </div>

      <div style={{ padding: "16px" }}>

        {/* ── Nästa match ─────────────────────────────────────── */}
        {nextMatch && (
          <div style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 16,
            padding: "16px",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 800, marginBottom: 8, letterSpacing: 0.5 }}>
              NÄSTA MATCH {daysUntil === 0 ? "— IDAG!" : daysUntil === 1 ? "— IMORGON" : ""}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>
                  vs {nextMatch.opponent}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  {FMT(nextMatch.date)}
                  {nextMatch.serie && <span style={{ marginLeft: 8, color: "#4a5568" }}>{nextMatch.serie}</span>}
                </div>
              </div>
              {daysUntil !== null && daysUntil > 1 && (
                <div style={{
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: 10,
                  padding: "6px 12px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#22c55e" }}>{daysUntil}</div>
                  <div style={{ fontSize: 9, color: "#4a5568", fontWeight: 700 }}>DAGAR</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Kommande matcher ────────────────────────────────── */}
        {upcoming.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>
              KOMMANDE MATCHER ({upcoming.length})
            </div>
            {upcoming.slice(0, 5).map(m => (
              <div key={m.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                marginBottom: 6,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>vs {m.opponent}</div>
                <div style={{ fontSize: 11, color: "#4a5568" }}>
                  {FMT(m.date)}
                  {m.serie && <span style={{ marginLeft: 6, fontSize: 10, color: "#475569" }}>{m.serie}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Lagmeddelanden (läsvy) ─────────────────────────── */}
        <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, letterSpacing: 0.5, marginBottom: 10 }}>
          LAGMEDDELANDEN
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#4a5568", fontSize: 13 }}>
            Laddar…
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#475569" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 13 }}>Inga meddelanden ännu.</div>
            <div style={{ fontSize: 11, color: "#4a5568", marginTop: 4 }}>
              Tränarna kan skicka meddelanden som visas här.
            </div>
          </div>
        )}

        {messages.map(m => {
          const isUrgent = m.urgent;
          return (
            <div
              key={m.id}
              style={{
                background: isUrgent ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.02)",
                border: "1px solid " + (isUrgent ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.06)"),
                borderRadius: 14,
                padding: "12px 14px",
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "rgba(56,189,248,0.12)",
                    border: "1.5px solid #38bdf8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: "#38bdf8" }}>
                      {(m.author_name || "?").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#38bdf8" }}>
                    {m.author_name || "Tränare"}
                  </span>
                  {isUrgent && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#fbbf24", background: "rgba(251,191,36,0.15)", padding: "2px 6px", borderRadius: 99 }}>
                      ⚡ BRÅDSKANDE
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 10, color: "#4a5568" }}>{fmtTime(m.created_at)}</span>
              </div>
              <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {m.body}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
