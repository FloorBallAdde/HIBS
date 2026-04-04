import { useState, useEffect, useCallback, useRef } from "react";
import { sbGet, sbPost, sbDel } from "../../lib/supabase.js";

/**
 * TeamMessages — Lagmeddelanden (P11 Föräldrakommunikation, Fas 1).
 * Sprint 26: Enkel meddelandefeed för tränare. Coaches postar korta meddelanden
 * (t.ex. "Träning inställd torsdag") som alla tränare i klubben ser.
 * Stödjer brådskande-flagga (gul markering) och radering av egna meddelanden.
 *
 * Supabase-tabell: team_messages (se migrerings-SQL i sprint-loggen).
 */
export default function TeamMessages({ clubId, uid, tok, profile }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);

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

  // Skicka meddelande
  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const row = {
        club_id: clubId,
        author_id: uid,
        author_name: profile?.username || "Tränare",
        body: trimmed,
        urgent,
      };
      const saved = await sbPost("team_messages", row, tok);
      const msg = Array.isArray(saved) && saved[0] ? saved[0] : { ...row, id: Date.now(), created_at: new Date().toISOString() };
      setMessages(prev => [msg, ...prev]);
      setText("");
      setUrgent(false);
    } catch (e) {
      console.error("TeamMessages send:", e);
    }
    setSending(false);
  };

  // Radera eget meddelande
  const remove = async (id) => {
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
      {/* ── Ny meddelande-input ──────────────────────────── */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "14px 16px",
        marginBottom: 16,
      }}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Skriv ett meddelande till laget…"
          rows={2}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            color: "#fff",
            fontSize: 14,
            padding: "10px 12px",
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          {/* Brådskande-toggle */}
          <button
            onClick={() => setUrgent(u => !u)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 99,
              border: "1px solid " + (urgent ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.1)"),
              background: urgent ? "rgba(251,191,36,0.1)" : "transparent",
              color: urgent ? "#fbbf24" : "#4a5568",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            ⚡ Brådskande
          </button>
          {/* Skicka-knapp */}
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            style={{
              padding: "8px 20px",
              borderRadius: 99,
              border: "none",
              background: text.trim() ? "#22c55e" : "rgba(255,255,255,0.06)",
              color: text.trim() ? "#0b0d14" : "#4a5568",
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "inherit",
              cursor: text.trim() ? "pointer" : "default",
              opacity: sending ? 0.6 : 1,
              minWidth: 80,
              minHeight: 44,
            }}
          >
            {sending ? "…" : "Skicka"}
          </button>
        </div>
      </div>

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
            {isOwn && (
              <button
                onClick={() => remove(m.id)}
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
                }}
              >
                🗑 Ta bort
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
