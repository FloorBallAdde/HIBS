import { useState } from "react";

/**
 * ParentInvite — Genererar en delbar invite-länk för föräldrar.
 * Sprint 34 (P11 Fas 2 Steg 2): Tränare delar länken via SMS/WhatsApp.
 * Föräldern öppnar, registrerar sig, och hamnar direkt i ParentView.
 *
 * Props:
 *   clubId — lagets club_id (för invite-parametern)
 */
export default function ParentInvite({ clubId }) {
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin + window.location.pathname;
  const inviteUrl = baseUrl + "?invite=" + clubId + "&role=parent";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select text (iOS Safari compat)
      const el = document.getElementById("hibs-invite-url");
      if (el) { el.select(); document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Gå med i laget!",
          text: "Registrera dig som förälder i HIBS-appen för att se matchschema och lagmeddelanden.",
          url: inviteUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  return (
    <div>
      <div style={{
        background: "rgba(244,114,182,0.06)",
        border: "1px solid rgba(244,114,182,0.2)",
        borderRadius: 16,
        padding: "20px 16px",
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 10, color: "#f472b6", fontWeight: 800, letterSpacing: 0.5, marginBottom: 12 }}>
          FÖRÄLDRALÄNK
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 16 }}>
          Dela denna länk med föräldrar. De registrerar sig och ser automatiskt lagets
          meddelanden och matchschema — utan tillgång till tränarvyn.
        </div>

        {/* URL display */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 14,
          position: "relative",
        }}>
          <input
            id="hibs-invite-url"
            readOnly
            value={inviteUrl}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              color: "#cbd5e1",
              fontSize: 12,
              fontFamily: "monospace",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleCopy}
            style={{
              flex: 1,
              padding: "14px 0",
              borderRadius: 12,
              border: copied ? "1.5px solid rgba(34,197,94,0.4)" : "1.5px solid rgba(244,114,182,0.3)",
              background: copied ? "rgba(34,197,94,0.1)" : "rgba(244,114,182,0.08)",
              color: copied ? "#22c55e" : "#f472b6",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "inherit",
              cursor: "pointer",
              minHeight: 48,
            }}
          >
            {copied ? "Kopierad!" : "Kopiera länk"}
          </button>

          {typeof navigator.share === "function" && (
            <button
              onClick={handleShare}
              style={{
                flex: 1,
                padding: "14px 0",
                borderRadius: 12,
                border: "1.5px solid rgba(56,189,248,0.3)",
                background: "rgba(56,189,248,0.08)",
                color: "#38bdf8",
                fontSize: 14,
                fontWeight: 800,
                fontFamily: "inherit",
                cursor: "pointer",
                minHeight: 48,
              }}
            >
              Dela
            </button>
          )}
        </div>
      </div>

      {/* How it works */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: "16px",
      }}>
        <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, letterSpacing: 0.5, marginBottom: 12 }}>
          SÅ FUNGERAR DET
        </div>
        {[
          ["1.", "Dela länken med föräldrarna (SMS, WhatsApp, etc.)"],
          ["2.", "Föräldern registrerar sig med email och lösenord"],
          ["3.", "De ser automatiskt lagets meddelanden och matchschema"],
        ].map(([num, text]) => (
          <div key={num} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "rgba(244,114,182,0.1)",
              border: "1px solid rgba(244,114,182,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#f472b6" }}>{num}</span>
            </div>
            <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
