import { useState } from "react";

export default function GoalModal({ player, onSave, onClose }) {
  const [goals, setGoals] = useState(player.goals || []);
  const addGoal = () => setGoals(g => [...g, { id: Date.now(), season: "2024/25", type: "Mål", desc: "" }]);
  const upd = (id, patch) => setGoals(g => g.map(x => x.id === id ? { ...x, ...patch } : x));
  const del = (id) => setGoals(g => g.filter(x => x.id !== id));

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", width: "100%", maxWidth: 430, maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Individuella mål - {player.name}</div>
        {goals.map(g => (
          <div key={g.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <select value={g.season || "2024/25"} onChange={e => upd(g.id, { season: e.target.value })} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12, padding: "6px 8px", fontFamily: "inherit", outline: "none" }}>
                {["2024/25", "2025/26"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={g.type || "Mål"} onChange={e => upd(g.id, { type: e.target.value })} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12, padding: "6px 8px", fontFamily: "inherit", outline: "none" }}>
                {["Mål", "Teknik", "Taktik", "Mental", "Fysik"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => del(g.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
            </div>
            <input value={g.desc || ""} onChange={e => upd(g.id, { desc: e.target.value })} placeholder="Beskriv målet..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 13, padding: "8px 10px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <button onClick={addGoal} style={{ width: "100%", padding: "10px 0", border: "1px dashed rgba(167,139,250,0.3)", borderRadius: 12, background: "transparent", color: "#a78bfa", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginBottom: 14 }}>+ Lägg till mål</button>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px 0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "transparent", color: "#4a5568", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Stäng</button>
          <button onClick={() => onSave(goals)} style={{ flex: 1, padding: "12px 0", border: "none", borderRadius: 12, background: "#a78bfa", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Spara</button>
        </div>
      </div>
    </div>
  );
}
