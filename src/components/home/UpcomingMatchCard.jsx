import { useState } from "react";
import StableInput from "../ui/StableInput.jsx";
import MatchRsvpModal from "./MatchRsvpModal.jsx";
import { SERIES, FMTW, TODAY, FONT, serieColor, isCup, matchTitle } from "../../lib/constants.js";

/**
 * UpcomingMatchCard — Sprint 79: omgjord till KALENDER.
 * Nästa händelse som hero + kompakt agenda grupperad per dag (veckodag),
 * cuper med 🏆 (aldrig "vs Minicup"), tid + hall, RSVP och borttag.
 * Behåller + Lägg till-formuläret och RSVP-modalen.
 */
export default function UpcomingMatchCard({ upcomingMatches, addUpcoming, removeUpcoming, updateUpcomingRsvp, players }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOpp, setNewOpp] = useState("");
  const [newDate, setNewDate] = useState(TODAY());
  const [newSerie, setNewSerie] = useState("14A");
  const [rsvpMatchId, setRsvpMatchId] = useState(null);

  const rsvpMatch = rsvpMatchId ? upcomingMatches.find(m => m.id === rsvpMatchId) : null;

  const handleAddMatch = () => {
    if (!newOpp.trim() || !newDate) return;
    addUpcoming({ opponent: newOpp.trim(), date: newDate, serie: newSerie });
    setNewOpp(""); setNewDate(TODAY()); setNewSerie("14A");
    setShowAddForm(false);
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const future = upcomingMatches.filter(m => new Date(m.date) >= today);
  const nextMatch = future[0];
  const daysUntil = nextMatch ? Math.ceil((new Date(nextMatch.date) - today) / (1000 * 60 * 60 * 24)) : null;

  // Agenda: händelser efter nästa, grupperade per dag (max 6)
  const agenda = future.slice(1, 7);
  const groups = [];
  agenda.forEach(m => {
    const g = groups[groups.length - 1];
    if (g && g.date === m.date) g.items.push(m);
    else groups.push({ date: m.date, items: [m] });
  });

  const sc = nextMatch ? serieColor(nextMatch.serie) : "#64748b";

  return (
    <>
      {rsvpMatch && (
        <MatchRsvpModal
          match={rsvpMatch}
          players={players}
          onToggle={updateUpcomingRsvp}
          onClose={() => setRsvpMatchId(null)}
        />
      )}

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: nextMatch || showAddForm ? 12 : 0 }}>
          <div style={{ fontSize: FONT.label, fontWeight: 700, color: "#64748b" }}>📅 KALENDER</div>
          <button onClick={() => setShowAddForm(f => !f)} style={{ padding: "6px 12px", minHeight: 32, border: "1px solid rgba(34,197,94,0.3)", borderRadius: 99, background: "rgba(34,197,94,0.08)", color: "#22c55e", fontSize: FONT.label, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
            {showAddForm ? "Avbryt" : "+ Lägg till"}
          </button>
        </div>

        {showAddForm && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <StableInput value={newOpp} onChange={e => setNewOpp(e.target.value)} placeholder="Motståndare / cup" style={{ flex: 1, minWidth: 0, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "8px 12px", fontFamily: "inherit", outline: "none" }} />
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ width: 120, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "8px 10px", fontFamily: "inherit", outline: "none", colorScheme: "dark" }} />
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {SERIES.map(s => (
                <button key={s} onClick={() => setNewSerie(s)} style={{ flex: 1, padding: "7px 0", border: "1px solid " + (newSerie === s ? "#f472b6" : "rgba(255,255,255,0.07)"), borderRadius: 8, background: newSerie === s ? "rgba(244,114,182,0.1)" : "transparent", color: newSerie === s ? "#f472b6" : "#64748b", fontSize: 10, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>{s}</button>
              ))}
            </div>
            <button onClick={handleAddMatch} style={{ width: "100%", padding: "10px 0", border: "none", borderRadius: 10, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>Lägg till</button>
          </div>
        )}

        {nextMatch ? (
          <div>
            {/* NÄSTA HÄNDELSE — hero */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: FONT.label, fontWeight: 800, color: sc, background: sc + "18", border: "1px solid " + sc + "40", borderRadius: 99, padding: "1px 8px", flexShrink: 0 }}>{isCup(nextMatch) ? "CUP" : nextMatch.serie}</span>
              <span style={{ fontSize: FONT.title, fontWeight: 900, color: "#fff", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{matchTitle(nextMatch)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {FMTW(nextMatch.date)}{nextMatch.time ? " · " + nextMatch.time : ""}{nextMatch.venue ? " · " + nextMatch.venue : ""}
              </span>
              {daysUntil === 0 && <span style={{ fontSize: 12, fontWeight: 800, color: "#22c55e", background: "rgba(34,197,94,0.1)", borderRadius: 99, padding: "2px 10px" }}>Idag! 🏑</span>}
              {daysUntil === 1 && <span style={{ fontSize: 12, fontWeight: 800, color: "#fbbf24", background: "rgba(251,191,36,0.1)", borderRadius: 99, padding: "2px 10px" }}>Imorgon</span>}
              {daysUntil > 1 && <span style={{ fontSize: 12, color: "#64748b" }}>om {daysUntil} dagar</span>}
              <button
                onClick={() => setRsvpMatchId(nextMatch.id)}
                style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", background: (nextMatch.rsvp?.length > 0) ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", border: "1px solid " + (nextMatch.rsvp?.length > 0 ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"), borderRadius: 99, color: nextMatch.rsvp?.length > 0 ? "#22c55e" : "#64748b", fontSize: FONT.label, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                👥 {nextMatch.rsvp?.length || 0}
              </button>
              <button onClick={() => removeUpcoming(nextMatch.id)} aria-label="Ta bort" style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 17, padding: 0, lineHeight: 1 }}>×</button>
            </div>

            {/* AGENDA — grupperad per dag */}
            {groups.map(g => (
              <div key={g.date} style={{ paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", marginBottom: 4, textTransform: "capitalize" }}>{FMTW(g.date)}</div>
                {g.items.map(m => {
                  const c = serieColor(m.serie);
                  return (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                      <span style={{ fontSize: FONT.label, color: "#64748b", width: 38, flexShrink: 0 }}>{m.time || "–"}</span>
                      <span style={{ fontSize: 10, color: c, background: c + "18", borderRadius: 99, padding: "1px 7px", fontWeight: 700, flexShrink: 0 }}>{isCup(m) ? "CUP" : m.serie}</span>
                      <span style={{ fontSize: 12, color: "#cbd5e1", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isCup(m) ? m.opponent : m.opponent}</span>
                      <button
                        onClick={() => setRsvpMatchId(m.id)}
                        style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 8px", background: (m.rsvp?.length > 0) ? "rgba(34,197,94,0.08)" : "transparent", border: "1px solid " + (m.rsvp?.length > 0 ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.06)"), borderRadius: 99, color: m.rsvp?.length > 0 ? "#22c55e" : "#475569", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
                      >
                        👥 {m.rsvp?.length || 0}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
            {future.length > 7 && (
              <div style={{ fontSize: 10, color: "#475569", textAlign: "center", paddingTop: 8 }}>
                + {future.length - 7} händelser till i säsongen
              </div>
            )}
          </div>
        ) : !showAddForm && (
          <div style={{ fontSize: 12, color: "#475569", textAlign: "center", padding: "4px 0" }}>Inga planerade matcher</div>
        )}
      </div>
    </>
  );
}
