import { useState, useRef } from "react";

/**
 * MessageComposer — inputfältet för Lagmeddelanden, extraherat ur
 * TeamMessages.jsx (Sprint 66). Självständig, statefull komponent: äger sitt
 * eget text/urgent/sending-state och exponerar bara `onSend(body, urgent)`
 * som förälder anropar mot Supabase. Samma mönster som ScoringPanel (S65) —
 * presentationskomponent som kapslar in sin egen interna UI-state.
 */
export default function MessageComposer({ onSend }) {
  const [text, setText] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed, urgent);
      setText("");
      setUrgent(false);
    } finally {
      setSending(false);
    }
  };

  return (
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
  );
}
