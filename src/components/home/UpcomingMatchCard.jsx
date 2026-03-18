import { useState } from "react";
import StableInput from "../ui/StableInput.jsx";
import MatchRsvpModal from "./MatchRsvpModal.jsx";
import { SERIES, FMT, TODAY } from "../../lib/constants.js";

/**
 * UpcomingMatchCard — visar nästa planerade match, lista med kommande matcher
 * och formulär för att lägga till ny match. Inkluderar RSVP-modalen.
 * Extraherat från HomeContent i Sprint 15.
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
  const nextMatch = upcomingMatches.find(m => new Date(m.date) >= today);
  const daysUntil = nextMatch ? Math.ceil((new Date(nextMatch.date) - today) / (1000 * 60 * 60 * 24)) : null;

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
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>NÄSTA MATCH</div>
          <button onClick={() => setShowAddForm(f => !f)} style={{ padding: "3px 10px", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 99, background: "rgba(34,197,94,0.08)", color: "#22c55e", fontSize: 10, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
            {showAddForm ? "Avbryt" : "+ Lägg till"}
          </button>
        </div>

        {showAddForm && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <StableInput value={newOpp} onChange={e => setNewOpp(e.target.value)} placeholder="Motståndare" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "8px 12px", fontFamily: "inherit", outline: "none" }} />
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ width: 120, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "8px 10px", fontFamily: "inherit", outline: "none", colorScheme: "dark" }} />
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {SERIES.map(s => (
                <button key={s} onClick={() => setNewSerie(s)} style={{ flex: 1, padding: "7px 0", border: "1px solid " + (newSerie === s ? "#f472b6" : "rgba(255,255,255,0.07)"), borderRadius: 8, background: newSerie === s ? "rgba(244,114,182,0.1)" : "transparent", color: newSerie === s ? "#f472b6" : "#64748b", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>{s}</button>
              ))}
            </div>
            <button onClick={handleAddMatch} style={{ width: "100%", padding: "10px 0", border: "none", borderRadius: 10, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>Lägg till match</button>
          </div>
        )}

        {nextMatch ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              {(() => {
                const sc = nextMatch.serie === "14A" ? "#f472b6" : nextMatch.serie === "15A" ? "#38bdf8" : "#fbbf24";
                return <span style={{ fontSize: 11, fontWeight: 800, color: sc, background: sc + "18", border: "1px solid " + sc + "40", borderRadius: 99, padding: "1px 8px" }}>{nextMatch.serie}</span>;
              })()}
              <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>vs {nextMatch.opponent}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>{FMT(nextMatch.date)}</span>
              {daysUntil === 0 && <span style={{ fontSize: 12, fontWeight: 800, color: "#22c55e", background: "rgba(34,197,94,0.1)", borderRadius: 99, padding: "2px 10px" }}>Idag! 🏑</span>}
              {daysUntil === 1 && <span style={{ fontSize: 12, fontWeight: 800, color: "#fbbf24", background: "rgba(251,191,36,0.1)", borderRadius: 99, padding: "2px 10px" }}>Imorgon</span>}
              {daysUntil > 1 && <span style={{ fontSize: 12, color: "#64748b" }}>om {daysUntil} dagar</span>}
              <button
                onClick={() => setRsvpMatchId(nextMatch.id)}
                style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", background: (nextMatch.rsvp?.length > 0) ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", border: "1px solid " + (nextMatch.rsvp?.length > 0 ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"), borderRadius: 99, color: nextMatch.rsvp?.length > 0 ? "#22c55e" : "#64748b", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                👥 {nextMatch.rsvp?.length || 0}
              </button>
              <button onClick={() => removeUpcoming(nextMatch.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 17, padding: 0, lineHeight: 1 }}>×</button>
            </div>
            {upcomingMatches.filter(m => m.id !== nextMatch.id).slice(0, 2).map(m => {
              const d = Math.ceil((new Date(m.date) - today) / (1000 * 60 * 60 * 24));
              const sc2 = m.serie === "14A" ? "#f472b6" : m.serie === "15A" ? "#38bdf8" : "#fbbf24";
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 10, color: sc2, background: sc2 + "18", borderRadius: 99, padding: "1px 7px", fontWeight: 700 }}>{m.serie}</span>
                  <span style={{ fontSize: 12, color: "#64748b", flex: 1 }}>vs {m.opponent}</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>{d > 0 ? `om ${d}d` : FMT(m.date)}</span>
                  <button
                    onClick={() => setRsvpMatchId(m.id)}
                    style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 8px", background: (m.rsvp?.length > 0) ? "rgba(34,197,94,0.08)" : "transparent", border: "1px solid " + (m.rsvp?.length > 0 ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.06)"), borderRadius: 99, color: m.rsvp?.length > 0 ? "#22c55e" : "#475569", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    👥 {m.rsvp?.length || 0}
                  </button>
                  <button onClick={() => removeUpcoming(m.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
                </div>
              );
            })}
          </div>
        ) : !showAddForm && (
          <div style={{ fontSize: 12, color: "#475569", textAlign: "center", padding: "4px 0" }}>Inga planerade matcher</div>
        )}
      </div>
    </>
  );
}
