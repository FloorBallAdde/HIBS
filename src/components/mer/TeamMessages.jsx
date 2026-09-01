import { useState, useEffect, useCallback, useRef } from "react";
import { sbGet, sbPost, sbDel } from "../../lib/supabase.js";
import MessageComposer from "./MessageComposer.jsx";

/**
 * TeamMessages — Lagmeddelanden (P11 Föräldrakommunikation, Fas 1).
 * Sprint 26: Enkel meddelandefeed för tränare. Coaches postar korta meddelanden
 * (t.ex. "Träning inställd torsdag") som alla tränare i klubben ser.
 * Stödjer brådskande-flagga (gul markering) och radering av egna meddelanden.
 *
 * Sprint 66: Composer extraherad till MessageComposer.jsx. Radering av egna
 * meddelanden kräver nu en bekräftelse (kalla händer + trängsel vid rinken —
 * ett feltryck ska inte radera ett meddelande permanent).
 *
 * Supabase-tabell: team_messages (se migrerings-SQL i sprint-loggen).
 */
export default function TeamMessages({ clubId, uid, tok, profile }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const confirmTimerRef = useRef(null);

  // Ladda meddelanden
  const loadMessages = useCallback(async () => {
    if (!clubId || !tok) return;
    try {
      const res = await sbGet(
        "team_messages",
        "club_id=eq." + clubId + "&order=created_at.desc&limit=50",
        tok
      );
      if (Array.isArray(res)) setMessages(res);
    } catch (e) {
      console.error("TeamMessages load:", e);
    }
    setLoading(false);
  }, [clubId, tok]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Polling var 30s — andra tränare kan posta meddelanden
  useEffect(() => {
    if (!clubId || !tok) return;
    const id = setInterval(loadMessages, 30_000);
    return () => clearInterval(id);
  }, [clubId, tok, loadMessages]);

  useEffect(() => () => clearTimeout(confirmTimerRef.current), []);

  // Skicka meddelande
  const send = async (body, urgent) => {
    try {
      const row = {
        club_id: clubId,
        author_id: uid,
        author_name: profile?.username || "Tränare",
        body,
        urgent,
      };
      const saved = await sbPost("team_messages", row, tok);
      const msg = Array.isArray(saved) && saved[0] ? saved[0] : { ...row, id: Date.now(), created_at: new Date().toISOString() };
      setMessages(prev => [msg, ...prev]);
    } catch (e) {
      console.error("TeamMessages send:", e);
    }
  };

  // Radera eget meddelande — kräver en bekräftelse-tryck till (rink-säkert).
  const requestRemove = (id) => {
    clearTimeout(confirmTimerRef.current);
    setConfirmingId(id);
    confirmTimerRef.current = setTimeout(() => setConfirmingId(null), 4000);
  };

  const cancelRemove = () => {
    clearTimeout(confirmTimerRef.current);
    setConfirmingId(null);
  };

  const confirmRemove = async (id) => {
    clearTimeout(confirmTimerRef.current);
    setConfirmingId(null);
    try {
      await sbDel("team_messages", id, tok);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      console.error("TeamMessages delete:", e);
    }
  };

  // Formatera tid
  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "Nu";
    if (diffMin < 60) return diffMin + " min sedan";
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return diffH + "h sedan";
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return diffD + "d sedan";
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  };

  return (
    <div>
      <MessageComposer onSend={send} />

      {/* ── Meddelandelista ──────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#4a5568", fontSize: 13 }}>
          Laddar meddelanden…
        </div>
      )}

      {!loading && messages.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#475569" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 13 }}>Inga meddelanden ännu.</div>
          <div style={{ fontSize: 11, color: "#4a5568", marginTop: 4 }}>
            Skriv första meddelandet till tränarlaget!
          </div>
        </div>
      )}

      {messages.map(m => {
        const isOwn = m.author_id === uid;
        const isUrgent = m.urgent;
        const isConfirming = confirmingId === m.id;
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
                {/* Avatar */}
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: isOwn ? "rgba(34,197,94,0.12)" : "rgba(56,189,248,0.12)",
                  border: "1.5px solid " + (isOwn ? "#22c55e" : "#38bdf8"),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: isOwn ? "#22c55e" : "#38bdf8" }}>
                    {(m.author_name || "?").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: isOwn ? "#22c55e" : "#38bdf8" }}>
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
            {isOwn && !isConfirming && (
              <button
                onClick={() => requestRemove(m.id)}
                style={{
                  marginTop: 8,
                  padding: "4px 10px",
                  borderRadius: 99,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "transparent",
                  color: "#64748b",
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  minHeight: 44,
                }}
              >
                🗑 Ta bort
              </button>
            )}
            {isOwn && isConfirming && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => confirmRemove(m.id)}
                  aria-label="Bekräfta borttagning av meddelandet"
                  title="Bekräfta borttagning"
                  style={{
                    padding: "4px 12px",
                    borderRadius: 99,
                    border: "1px solid rgba(248,113,113,0.4)",
                    background: "rgba(248,113,113,0.12)",
                    color: "#f87171",
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    minHeight: 44,
                  }}
                >
                  ✓ Bekräfta borttagning
                </button>
                <button
                  onClick={cancelRemove}
                  aria-label="Avbryt borttagning"
                  title="Avbryt"
                  style={{
                    padding: "4px 12px",
                    borderRadius: 99,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "transparent",
                    color: "#64748b",
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    minHeight: 44,
                  }}
                >
                  Avbryt
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
