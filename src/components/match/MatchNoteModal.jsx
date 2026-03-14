/**
 * MatchNoteModal — Noteringsmodal med "Kopiera för Claude"-knapp.
 * Kopierar ett färdigformaterat block med matchdata + notering
 * redo att klistras in i Claude-chatten för att generera 3 texter.
 */
import { useState } from "react";

function buildClaudeText(match, note) {
  const result = match.result
    ? `HIBS ${match.result.us} – ${match.result.them}`
    : "Ej ifyllt";

  const lagmal =
    Array.isArray(match.teamGoals) && match.teamGoals.filter(Boolean).length > 0
      ? match.teamGoals.filter(Boolean).join(", ")
      : "–";

  return [
    "🏑 HIBS P2015 — Matchsammanfattning",
    "",
    `Motståndare: ${match.opponent || "–"}`,
    `Datum: ${match.date || "–"}`,
    `Serie: ${match.serie || "–"}`,
    `Resultat: ${result}`,
    `Lagmål: ${lagmal}`,
    "",
    `Tränarens notering: ${note || "–"}`,
    "",
    "---",
    "Skriv om detta till tre texter:",
    "1. SPELARNA — engagerande och peppad, för WhatsApp till laget",
    "2. FÖRÄLDRARNA — varm och uppskattande, för WhatsApp till föräldragruppen",
    "3. TRÄNARNA — analytisk inför nästa träning",
    "Inkludera INTE individuella målskyttar eller assist.",
  ].join("\n");
}

export default function MatchNoteModal({ match, onClose, onSave }) {
  const [note, setNote] = useState(match?.note || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!match) return null;

  const handleSave = async () => {
    setSaving(true);
    await onSave(note);
    setSaving(false);
  };

  const handleCopy = async () => {
    const text = buildClaudeText(match, note);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback för äldre browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)",
        zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#161926", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px 20px 0 0", padding: "24px 20px 40px",
          width: "100%", maxWidth: 430,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
          Notering — vs {match.opponent}
        </div>
        {match.result && (
          <div style={{ fontSize: 12, color: "#4a5568", marginBottom: 14 }}>
            {match.result.us}–{match.result.them} · {match.serie}
          </div>
        )}

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="T.ex. bra press, jobbig domare, fantastisk energi..."
          style={{
            width: "100%", minHeight: 90,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, color: "#fff", fontSize: 14, padding: 12,
            fontFamily: "inherit", resize: "none", outline: "none",
            boxSizing: "border-box", marginBottom: 12,
          }}
        />

        {/* Info-rad om kopiera-flödet */}
        <div style={{
          background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.15)",
          borderRadius: 10, padding: "9px 12px", marginBottom: 12,
          fontSize: 12, color: "#a78bfa", lineHeight: 1.5,
        }}>
          Kopiera matchinfo → klistra in i Claude → få 3 färdiga texter att dela
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "12px 0", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, background: "transparent", color: "#4a5568",
              fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
            }}
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: "12px 0", border: "1px solid rgba(167,139,250,0.3)",
              borderRadius: 12, background: "transparent", color: "#a78bfa",
              fontSize: 13, fontWeight: 700, fontFamily: "inherit",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Sparar..." : "Spara"}
          </button>
          <button
            onClick={handleCopy}
            style={{
              flex: 2, padding: "12px 0", border: "none", borderRadius: 12,
              background: copied
                ? "rgba(34,197,94,0.2)"
                : "linear-gradient(135deg,#a78bfa,#7c3aed)",
              color: copied ? "#22c55e" : "#fff",
              fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
              transition: "all 0.25s",
            }}
          >
            {copied ? "✓ Kopierat!" : "📋 Kopiera för Claude"}
          </button>
        </div>
      </div>
    </div>
  );
}
