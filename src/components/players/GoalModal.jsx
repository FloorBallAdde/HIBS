import { useState, useRef, useCallback } from "react";

/**
 * GoalModal — Individuella spelarutvecklingsmål.
 * Sprint 10+: Tre sektioner per mål: Spelarens mål / Tränarfeedback / Tränarens utmaning.
 * Auto-sparar 1.5s efter sista ändringen. Inga ändringar kan försvinna.
 *
 * Datamigration: gamla mål {id,season,type,desc} migreras sömlöst till nytt format.
 */

const TYPES    = ["Teknik", "Taktik", "Mental", "Fysik", "Övrigt"];
const SEASONS  = ["2024/25", "2025/26", "2026/27"];
const STATUSES = [
  { id: "Pågår",      color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  { id: "Uppnått",    color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  { id: "Ej börjat",  color: "#4a5568", bg: "rgba(74,85,104,0.12)"   },
  { id: "Pausad",     color: "#64748b", bg: "rgba(100,116,139,0.12)" },
];

/** Migrerar gammalt goal-format till nytt */
function migrate(g) {
  return {
    id:             g.id          ?? Date.now(),
    season:         g.season      ?? "2025/26",
    type:           g.type        ?? "Teknik",
    status:         g.status      ?? "Pågår",
    desc:           g.desc        ?? "",   // Spelarens mål
    coachFeedback:  g.coachFeedback  ?? "",
    coachChallenge: g.coachChallenge ?? "",
    followUpDate:   g.followUpDate   ?? "",
    createdAt:      g.createdAt   ?? new Date().toISOString(),
    updatedAt:      g.updatedAt   ?? new Date().toISOString(),
  };
}

function newGoal() {
  return migrate({ id: Date.now(), createdAt: new Date().toISOString() });
}

const TA = ({ value, onChange, placeholder, minHeight = 68, accentColor = "#a78bfa" }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={3}
    style={{
      width: "100%",
      minHeight,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 10,
      color: "#fff",
      fontSize: 13,
      lineHeight: 1.55,
      padding: "9px 12px",
      fontFamily: "inherit",
      outline: "none",
      resize: "vertical",
      boxSizing: "border-box",
      transition: "border-color 0.15s",
    }}
    onFocus={e => { e.target.style.borderColor = accentColor + "60"; }}
    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; }}
  />
);

export default function GoalModal({ player, onSave, onClose }) {
  const [goals, setGoals] = useState(() => (player.goals || []).map(migrate));
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [lastSaved, setLastSaved] = useState(null);
  const [expandedId, setExpandedId] = useState(() => {
    const gs = (player.goals || []).map(migrate);
    return gs.length > 0 ? gs[0].id : null;
  });

  const debounceRef = useRef(null);
  const goalsRef = useRef(goals); // Håller alltid senaste goals för close-save
  const dirtyRef = useRef(false);  // Har det gjorts ändringar som inte sparats?

  /** Sparar direkt — används vid stängning och manuell spara */
  const saveNow = useCallback(async (latestGoals) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus("saving");
    try {
      await onSave(latestGoals);
      setSaveStatus("saved");
      setLastSaved(new Date());
      dirtyRef.current = false;
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e) {
      setSaveStatus("error");
    }
  }, [onSave]);

  /** Auto-save med 1.5s debounce */
  const triggerSave = useCallback((updatedGoals) => {
    goalsRef.current = updatedGoals;
    dirtyRef.current = true;
    setSaveStatus("dirty");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNow(updatedGoals), 1500);
  }, [saveNow]);

  /** Stäng säkert — spara alltid eventuella osparade ändringar först */
  const handleClose = useCallback(async () => {
    if (dirtyRef.current) {
      await saveNow(goalsRef.current);
    }
    onClose();
  }, [saveNow, onClose]);

  const updateGoal = (id, patch) => {
    const updated = goals.map(g =>
      g.id === id ? { ...g, ...patch, updatedAt: new Date().toISOString() } : g
    );
    setGoals(updated);
    triggerSave(updated);
  };

  const addGoal = () => {
    const g = newGoal();
    const updated = [g, ...goals];
    setGoals(updated);
    setExpandedId(g.id);
    triggerSave(updated);
  };

  const deleteGoal = (id) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    if (expandedId === id) setExpandedId(updated[0]?.id ?? null);
    triggerSave(updated);
  };

  const statusFor = (s) => STATUSES.find(x => x.id === s) ?? STATUSES[0];

  const fmt = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  const fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  const SaveBadge = () => {
    if (saveStatus === "saving") return (
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#4a5568" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4a5568", display: "inline-block", animation: "pulse 1s infinite" }} />
        Sparar...
      </div>
    );
    if (saveStatus === "saved") return (
      <div style={{ fontSize: 11, color: "#22c55e" }}>
        ✓ Sparat {lastSaved ? fmt(lastSaved.toISOString()) : ""}
      </div>
    );
    if (saveStatus === "error") return (
      <div style={{ fontSize: 11, color: "#f87171" }}>⚠ Kunde inte spara</div>
    );
    if (saveStatus === "dirty") return (
      <div style={{ fontSize: 11, color: "#4a5568" }}>Väntar på sparning...</div>
    );
    return null;
  };

  return (
    <div
      onClick={handleClose}
      className="hibs-overlay"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="hibs-sheet"
        style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px 20px 0 0", padding: "20px 18px 48px", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>Individuella mål</div>
            <div style={{ fontSize: 12, color: "#a78bfa", fontWeight: 700 }}>{player.name}</div>
          </div>
          <button onClick={handleClose} style={{ background: "none", border: "none", color: "#4a5568", fontSize: 22, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>×</button>
        </div>

        {/* Save status */}
        <div style={{ minHeight: 20, marginBottom: 14 }}>
          <SaveBadge />
        </div>

        {/* Goals list */}
        {goals.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#475569" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
            <div style={{ fontSize: 13 }}>Inga mål ännu — lägg till ett nedan</div>
          </div>
        )}

        {goals.map((g) => {
          const st = statusFor(g.status);
          const isOpen = expandedId === g.id;
          return (
            <div
              key={g.id}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, marginBottom: 10, overflow: "hidden" }}
            >
              {/* Goal header — always visible */}
              <div
                onClick={() => setExpandedId(isOpen ? null : g.id)}
                style={{ padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                {/* Type + Season */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa", background: "rgba(167,139,250,0.12)", borderRadius: 6, padding: "2px 8px" }}>{g.type}</span>
                    <span style={{ fontSize: 10, color: "#4a5568" }}>{g.season}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, borderRadius: 6, padding: "2px 8px" }}>{g.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: g.desc ? "#cbd5e1" : "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {g.desc || "Beskriv spelarens mål..."}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  {g.followUpDate && (
                    <span style={{ fontSize: 10, color: "#38bdf8", background: "rgba(56,189,248,0.08)", borderRadius: 6, padding: "2px 7px" }}>📅 {g.followUpDate}</span>
                  )}
                  <span style={{ fontSize: 14, color: "#4a5568" }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded content */}
              {isOpen && (
                <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

                  {/* Type / Season / Status row */}
                  <div style={{ display: "flex", gap: 6, marginTop: 12, marginBottom: 14 }}>
                    <select
                      value={g.type}
                      onChange={e => updateGoal(g.id, { type: e.target.value })}
                      style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12, padding: "7px 8px", fontFamily: "inherit", outline: "none" }}
                    >
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      value={g.season}
                      onChange={e => updateGoal(g.id, { season: e.target.value })}
                      style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12, padding: "7px 8px", fontFamily: "inherit", outline: "none" }}
                    >
                      {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                      value={g.status}
                      onChange={e => updateGoal(g.id, { status: e.target.value })}
                      style={{ flex: 1, background: statusFor(g.status).bg, border: "1px solid " + statusFor(g.status).color + "40", borderRadius: 8, color: statusFor(g.status).color, fontSize: 12, padding: "7px 8px", fontFamily: "inherit", outline: "none", fontWeight: 700 }}
                    >
                      {STATUSES.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                    </select>
                  </div>

                  {/* 1. Spelarens mål */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#a78bfa", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      🎯 SPELARENS MÅL
                      <span style={{ fontSize: 9, fontWeight: 400, color: "#475569" }}>— vad vill spelaren uppnå?</span>
                    </div>
                    <TA
                      value={g.desc}
                      onChange={e => updateGoal(g.id, { desc: e.target.value })}
                      placeholder="T.ex. Jag vill bli bättre på att ta emot bollen med vänsterfoten under press..."
                      accentColor="#a78bfa"
                    />
                  </div>

                  {/* 2. Tränarfeedback */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#38bdf8", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      💬 TRÄNARFEEDBACK
                      <span style={{ fontSize: 9, fontWeight: 400, color: "#475569" }}>— tränarens observation & bedömning</span>
                    </div>
                    <TA
                      value={g.coachFeedback}
                      onChange={e => updateGoal(g.id, { coachFeedback: e.target.value })}
                      placeholder="T.ex. Joel visar tydlig förbättring i sin vänsterfot. Bra attityd i träningen — tar till sig feedback snabbt..."
                      accentColor="#38bdf8"
                    />
                  </div>

                  {/* 3. Tränarens utmaning */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#fbbf24", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      ⚡ TRÄNARENS UTMANING
                      <span style={{ fontSize: 9, fontWeight: 400, color: "#475569" }}>— konkret uppgift till nästa uppföljning</span>
                    </div>
                    <TA
                      value={g.coachChallenge}
                      onChange={e => updateGoal(g.id, { coachChallenge: e.target.value })}
                      placeholder="T.ex. 10 min vänsterfotträning hemma 3 gånger i veckan. På varje träning: välj aktivt vänsterfoten i anfall..."
                      accentColor="#fbbf24"
                      minHeight={80}
                    />
                  </div>

                  {/* Uppföljningsdatum */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#38bdf8", flexShrink: 0 }}>📅 UPPFÖLJNING</div>
                    <input
                      type="date"
                      value={g.followUpDate || ""}
                      onChange={e => updateGoal(g.id, { followUpDate: e.target.value })}
                      style={{ flex: 1, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 8, color: "#fff", fontSize: 12, padding: "7px 10px", fontFamily: "inherit", outline: "none", colorScheme: "dark" }}
                    />
                    {g.followUpDate && (() => {
                      const days = Math.ceil((new Date(g.followUpDate) - new Date()) / (1000*60*60*24));
                      const color = days < 0 ? "#f87171" : days <= 7 ? "#fbbf24" : "#4a5568";
                      const label = days < 0 ? `${Math.abs(days)} d sedan` : days === 0 ? "Idag!" : `om ${days} d`;
                      return <span style={{ fontSize: 11, color, fontWeight: 700, flexShrink: 0 }}>{label}</span>;
                    })()}
                  </div>

                  {/* Senast uppdaterad + radera */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 10, color: "#475569" }}>
                      Uppdaterad {fmt(g.updatedAt)}
                    </div>
                    <button
                      onClick={() => deleteGoal(g.id)}
                      style={{ padding: "5px 12px", background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, color: "#f87171", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                    >
                      Radera mål
                    </button>
                  </div>

                </div>
              )}
            </div>
          );
        })}

        {/* Add goal */}
        <button
          onClick={addGoal}
          style={{ width: "100%", padding: "12px 0", border: "1px dashed rgba(167,139,250,0.3)", borderRadius: 12, background: "transparent", color: "#a78bfa", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginTop: 4 }}
        >
          + Nytt mål
        </button>

        {/* Manual save + close */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            onClick={handleClose}
            style={{ flex: 1, padding: "13px 0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "transparent", color: "#4a5568", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
          >
            Stäng
          </button>
          <button
            onClick={async () => {
              setSaveStatus("saving");
              try {
                await onSave(goals);
                setSaveStatus("saved");
                setLastSaved(new Date());
                setTimeout(() => setSaveStatus("idle"), 3000);
              } catch {
                setSaveStatus("error");
              }
            }}
            style={{ flex: 2, padding: "13px 0", border: "none", borderRadius: 12, background: saveStatus === "error" ? "#f87171" : "linear-gradient(135deg,#a78bfa,#7c3aed)", color: "#fff", fontSize: 14, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}
          >
            {saveStatus === "saving" ? "Sparar..." : saveStatus === "saved" ? "✓ Sparat" : saveStatus === "error" ? "⚠ Försök igen" : "Spara nu"}
          </button>
        </div>

      </div>
    </div>
  );
}
