import { useState } from "react";
import { FONT } from "../../lib/constants.js";

/**
 * SubstitutionPanel — spelarbyten under pågående match.
 * Extraherad från LiveMatchView i Sprint 58 (var inline Sprint 16).
 * Äger egen UI-state (öppen/vald-ut) och härleder vilka som är på plan / på bänken.
 * Sprint 58: glance-rad "X på plan · Y på bänken" (röd när 0 avbytare) — så man
 * vid rinken med kalla händer ser direkt om byte ens är möjligt innan man trycker.
 */
export default function SubstitutionPanel({
  activeMatch,
  players,
  substitutions,
  makeSubstitution,
}) {
  const [subOpen, setSubOpen] = useState(false);
  const [subOut, setSubOut] = useState(null); // player id to take off

  // Spelare på plan (utespelare, exkl. målvakt) — dynamisk baserat på activeMatch.players
  const onPitch = players.filter(p => (activeMatch.players || []).includes(p.id));
  // Alla spelare som INTE är på plan och INTE är målvakt — potentiella avbytare
  const offPitch = players.filter(p =>
    !(activeMatch.players || []).includes(p.id) &&
    !(activeMatch.goalkeeper || []).includes(p.id) &&
    p.role !== "malvakt" &&
    !(p.note && p.note.startsWith("⚠")) &&
    p.fitness !== "injured"
  );

  const handleSubConfirm = (inId) => {
    if (!subOut) return;
    makeSubstitution(subOut, inId);
    setSubOut(null);
    setSubOpen(false);
  };

  const noSubs = offPitch.length === 0;

  return (
    <div style={{ marginBottom: 14 }}>
      <button
        onClick={() => { setSubOpen(o => !o); setSubOut(null); }}
        style={{
          width: "100%",
          padding: "13px 0",
          border: "1px solid rgba(251,191,36,0.25)",
          borderRadius: 14,
          background: subOpen ? "rgba(251,191,36,0.10)" : "rgba(251,191,36,0.04)",
          color: "#fbbf24",
          fontSize: 14,
          fontWeight: 800,
          fontFamily: "inherit",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        🔄 Byte {substitutions?.length > 0 ? `(${substitutions.length})` : ""}
      </button>

      {/* Glance-rad: trupp på plan vs bänk (Sprint 58) */}
      <div style={{
        fontSize: FONT.label,
        color: "#64748b",
        fontWeight: 600,
        textAlign: "center",
        marginTop: 6,
      }}>
        {onPitch.length} på plan ·{" "}
        <span style={{ color: noSubs ? "#f87171" : "#94a3b8", fontWeight: noSubs ? 800 : 600 }}>
          {noSubs ? "inga avbytare" : `${offPitch.length} på bänken`}
        </span>
      </div>

      {/* Byte-panel */}
      {subOpen && (
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(251,191,36,0.15)",
          borderRadius: 14,
          padding: 14,
          marginTop: 8,
        }}>
          {/* Steg 1: Välj spelare UT */}
          <div style={{ fontSize: FONT.label, fontWeight: 800, color: "#f87171", marginBottom: 8, letterSpacing: "0.06em" }}>
            {subOut ? "✓ UT: " + (players.find(p => p.id === subOut)?.name || "?") : "1. VÄLJ SPELARE UT"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {onPitch.map(p => {
              const isOut = subOut === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSubOut(isOut ? null : p.id)}
                  style={{
                    padding: "7px 14px",
                    border: "1.5px solid " + (isOut ? "#f87171" : "rgba(255,255,255,0.10)"),
                    borderRadius: 99,
                    background: isOut ? "rgba(248,113,113,0.12)" : "transparent",
                    color: isOut ? "#f87171" : "#94a3b8",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    minHeight: 44,
                  }}
                >
                  {p.name}
                </button>
              );
            })}
          </div>

          {/* Steg 2: Välj spelare IN (visas bara om UT vald) */}
          {subOut && (
            <>
              <div style={{ fontSize: FONT.label, fontWeight: 800, color: "#22c55e", marginBottom: 8, letterSpacing: "0.06em" }}>
                2. VÄLJ SPELARE IN
              </div>
              {offPitch.length === 0 ? (
                <div style={{ fontSize: 12, color: "#64748b", padding: "8px 0" }}>
                  Inga tillgängliga avbytare
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {offPitch.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSubConfirm(p.id)}
                      style={{
                        padding: "7px 14px",
                        border: "1.5px solid rgba(34,197,94,0.25)",
                        borderRadius: 99,
                        background: "rgba(34,197,94,0.06)",
                        color: "#22c55e",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "inherit",
                        cursor: "pointer",
                        minHeight: 44,
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Byte-logg */}
      {substitutions?.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: FONT.label, color: "#64748b", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 4 }}>
            BYTEN
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {substitutions.map((s, i) => (
              <span key={i} style={{
                padding: "4px 10px",
                borderRadius: 99,
                background: "rgba(251,191,36,0.06)",
                border: "1px solid rgba(251,191,36,0.15)",
                color: "#fbbf24",
                fontSize: FONT.label,
                fontWeight: 600,
              }}>
                <span style={{ color: "#f87171" }}>↓{s.outName}</span>
                {" "}
                <span style={{ color: "#22c55e" }}>↑{s.inName}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
