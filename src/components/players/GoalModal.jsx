import { useState, useRef, useCallback } from "react";
import IconButton from "../ui/IconButton.jsx";
import Sheet from "../ui/Sheet.jsx";
import GoalCard from "./GoalCard.jsx";

/**
 * GoalModal — Individuella spelarutvecklingsmål.
 * Sprint 10+: Tre sektioner per mål: Spelarens mål / Tränarfeedback / Tränarens utmaning.
 * Auto-sparar 1.5s efter sista ändringen. Inga ändringar kan försvinna.
 * Sprint 60: enskilt mål-kort extraherat till GoalCard.jsx — modalen sköter state & sparning.
 *
 * Datamigration: gamla mål {id,season,type,desc} migreras sömlöst till nytt format.
 */

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

  const fmt = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
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
    <Sheet onClose={handleClose} overlayOpacity={0.88} maxWidth={480} maxHeight="90vh" padding="20px 18px 48px">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>Individuella mål</div>
            <div style={{ fontSize: 12, color: "#a78bfa", fontWeight: 700 }}>{player.name}</div>
          </div>
          <IconButton label="Stäng" onClick={handleClose} color="#4a5568" fontSize={22}>×</IconButton>
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

        {goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            isOpen={expandedId === g.id}
            onToggle={() => setExpandedId(expandedId === g.id ? null : g.id)}
            onUpdate={updateGoal}
            onDelete={deleteGoal}
          />
        ))}

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

    </Sheet>
  );
}
