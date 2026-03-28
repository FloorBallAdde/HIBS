import { useState, useEffect } from "react";
import ls from "../../lib/storage.js";
import { CATEGORIES, CAT_COLOR, gc } from "../../lib/constants.js";

const TODAY = () => new Date().toISOString().slice(0, 10);
const FMT = d => d ? new Date(d).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) : "-";

/**
 * PlaneraTab — Sprint 23: added P12 attendance marking in history view.
 * New props: players, attendance, onToggleAttendance
 */
export default function PlaneraTab({ exercises, trainHistory, onSave, onDelete, players = [], attendance = {}, onToggleAttendance }) {
  const [phase, setPhase] = useState("build");
  const [plan, setPlan] = useState(() => ls.get("hibs_plan_draft", []));
  const [note, setNote] = useState(() => ls.get("hibs_plan_note", ""));
  const [picking, setPicking] = useState(false);
  const [cat, setCat] = useState("Alla");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [attOpenId, setAttOpenId] = useState(null); // which session has attendance panel open

  useEffect(() => { ls.set("hibs_plan_draft", plan); }, [plan]);
  useEffect(() => { ls.set("hibs_plan_note", note); }, [note]);

  const filtered = exercises.filter(e => {
    if (cat !== "Alla" && e.category !== cat) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const addEx = ex => { setPlan(p => [...p, { id: Date.now(), exercise: ex, minutes: 10 }]); setPicking(false); setSearch(""); };
  const removeEx = id => setPlan(p => p.filter(x => x.id !== id));
  const setMin = (id, val) => setPlan(p => p.map(x => x.id === id ? { ...x, minutes: Math.max(1, parseInt(val) || 1) } : x));
  const moveUp = idx => { if (idx === 0) return; setPlan(p => { const a = [...p]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a; }); };
  const moveDown = idx => { if (idx === plan.length - 1) return; setPlan(p => { const a = [...p]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return a; }); };
  const totalMin = plan.reduce((s, x) => s + (parseInt(x.minutes) || 0), 0);
  const handleSave = async () => {
    if (!plan.length) return;
    const entry = { date: TODAY(), exercises: plan.map(x => ({ name: x.exercise.name, minutes: x.minutes, category: x.exercise.category })), totalMinutes: totalMin, note: note.trim() };
    await onSave(entry);
    setSaved(true);
    setTimeout(() => { setPlan([]); setNote(""); ls.set("hibs_plan_draft", []); ls.set("hibs_plan_note", ""); setSaved(false); setPhase("history"); }, 1200);
  };

  if (phase === "history") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Träningslogg</div>
        <button onClick={() => setPhase("build")} style={{ padding: "8px 16px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 99, color: "#22c55e", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>+ Ny träning</button>
      </div>
      {trainHistory.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: "#475569", fontSize: 14 }}>Inga träningar sparade ännu.</div>}
      {trainHistory.map(entry => {
        const sessionAtt = attendance[entry.id] || [];
        const attOpen = attOpenId === entry.id;
        const hasAtt = sessionAtt.length > 0;
        return (
          <div key={entry.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{FMT(entry.date)}</div>
                <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>{(entry.exercises || []).length} övningar - {entry.total_minutes || entry.totalMinutes} min</div>
              </div>
              {/* Attendance counter chip */}
              {hasAtt && (
                <div style={{ fontSize: 10, fontWeight: 700, color: "#34d399", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 99, padding: "3px 9px" }}>
                  👥 {sessionAtt.length}/{players.length}
                </div>
              )}
            </div>

            {(entry.exercises || []).map((ex, i) => { const cc = CAT_COLOR[ex.category] || "#64748b"; return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 8, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: cc, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#cbd5e1", flex: 1 }}>{ex.name}</span>
                <span style={{ fontSize: 11, color: "#4a5568" }}>{ex.minutes} min</span>
              </div>
            ); })}

            {entry.note && <div style={{ marginTop: 8, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#94a3b8" }}>{entry.note}</div>}

            {/* ── Attendance toggle button ─────────────────────────────── */}
            {players.length > 0 && onToggleAttendance && (
              <button
                onClick={() => setAttOpenId(attOpen ? null : entry.id)}
                style={{
                  marginTop: 10, width: "100%", padding: "9px 0",
                  border: "1px solid " + (attOpen ? "rgba(52,211,153,0.4)" : "rgba(52,211,153,0.18)"),
                  borderRadius: 8,
                  background: attOpen ? "rgba(52,211,153,0.08)" : "transparent",
                  color: attOpen ? "#34d399" : "#4a5568",
                  fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                👥 {attOpen ? "Stäng närvaro" : hasAtt ? `Närvaro (${sessionAtt.length}/${players.length})` : "Markera närvaro"}
              </button>
            )}

            {/* ── Attendance picker ────────────────────────────────────── */}
            {attOpen && players.length > 0 && (
              <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)", borderRadius: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#34d399", marginBottom: 10, letterSpacing: "0.08em" }}>
                  NÄRVARO — {sessionAtt.length} av {players.length} spelare
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {players.map(p => {
                    const pgc = gc(p.group);
                    const present = sessionAtt.includes(p.name);
                    return (
                      <button
                        key={p.id}
                        onClick={() => onToggleAttendance(entry.id, p.name)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          minHeight: 44, padding: "8px 14px",
                          border: "1.5px solid " + (present ? pgc.border : "rgba(255,255,255,0.1)"),
                          borderRadius: 99,
                          background: present ? pgc.bg : "rgba(255,255,255,0.02)",
                          color: present ? pgc.color : "#64748b",
                          fontSize: 13, fontWeight: present ? 800 : 500,
                          fontFamily: "inherit", cursor: "pointer",
                          transition: "all 0.1s",
                        }}
                      >
                        {present ? <span style={{ fontSize: 11 }}>✓</span> : <div style={{ width: 7, height: 7, borderRadius: "50%", background: pgc.color, opacity: 0.5 }} />}
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button onClick={() => onDelete(entry.id)} style={{ marginTop: 10, width: "100%", padding: "7px 0", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, background: "transparent", color: "#f87171", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Ta bort</button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Dagens träning</div>
        <button onClick={() => setPhase("history")} style={{ fontSize: 11, color: "#4a5568", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Logg</button>
      </div>
      {plan.length > 0 && <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>{plan.length} övningar</span><span style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>{totalMin} min</span></div>}
      {plan.length === 0 && !picking && <div style={{ textAlign: "center", padding: "28px 0 12px", color: "#475569", fontSize: 13 }}>Tryck + för att lägga till övningar.</div>}
      {plan.map((item, idx) => { const cc = CAT_COLOR[item.exercise.category] || "#64748b"; const isExp = expandedId === item.id; return (
        <div key={item.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, marginBottom: 8, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
              <button onClick={() => moveUp(idx)} style={{ background: "none", border: "none", color: idx === 0 ? "#1e293b" : "#4a5568", cursor: idx === 0 ? "default" : "pointer", fontSize: 11, padding: "2px 4px", lineHeight: 1 }}>▲</button>
              <button onClick={() => moveDown(idx)} style={{ background: "none", border: "none", color: idx === plan.length - 1 ? "#1e293b" : "#4a5568", cursor: idx === plan.length - 1 ? "default" : "pointer", fontSize: 11, padding: "2px 4px", lineHeight: 1 }}>▼</button>
            </div>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 11, fontWeight: 900, color: "#22c55e" }}>{idx + 1}</span></div>
            <div style={{ flex: 1, minWidth: 0 }} onClick={() => setExpandedId(isExp ? null : item.id)}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.exercise.name}</div>
              <div style={{ fontSize: 10, color: cc, marginTop: 2 }}>{item.exercise.category}</div>
            </div>
            <input type="number" value={item.minutes} onChange={e => setMin(item.id, e.target.value)} style={{ width: 52, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", fontSize: 13, fontWeight: 700, padding: "4px 8px", fontFamily: "inherit", outline: "none", textAlign: "center" }} />
            <span style={{ fontSize: 10, color: "#4a5568" }}>min</span>
            <button onClick={() => removeEx(item.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, padding: "0 2px", flexShrink: 0 }}>×</button>
          </div>
          {isExp && item.exercise.vad && <div style={{ padding: "0 14px 10px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{item.exercise.vad}</div>}
        </div>
      ); })}
      {!picking && <button onClick={() => setPicking(true)} style={{ width: "100%", padding: 12, border: "1px dashed rgba(34,197,94,0.3)", borderRadius: 14, background: "rgba(34,197,94,0.04)", color: "#22c55e", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginBottom: 12 }}>+ Lägg till övning</button>}
      {picking && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Välj övning</div>
            <button onClick={() => { setPicking(false); setSearch(""); }} style={{ background: "none", border: "none", color: "#4a5568", cursor: "pointer", fontSize: 20 }}>×</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök..." style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "8px 12px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
          <div style={{ overflowX: "auto", paddingBottom: 4, marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 6, width: "max-content" }}>
              {CATEGORIES.map(c => <button key={c} onClick={() => setCat(c)} style={{ padding: "4px 10px", border: "1px solid " + (cat === c ? "#22c55e" : "rgba(255,255,255,0.07)"), borderRadius: 99, background: cat === c ? "rgba(34,197,94,0.12)" : "transparent", color: cat === c ? "#22c55e" : "#4a5568", fontSize: 10, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}>{c}</button>)}
            </div>
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
            {filtered.map(ex => { const alreadyIn = plan.some(p => p.exercise.id === ex.id); const cc = CAT_COLOR[ex.category] || "#64748b"; return (
              <div key={ex.id} onClick={() => !alreadyIn && addEx(ex)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: alreadyIn ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.04)", border: "1px solid " + (alreadyIn ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)"), borderRadius: 10, cursor: alreadyIn ? "default" : "pointer", opacity: alreadyIn ? 0.4 : 1 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cc, flexShrink: 0 }} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{ex.name}</div><div style={{ fontSize: 10, color: "#4a5568" }}>{ex.category}</div></div>
                {alreadyIn ? <span style={{ fontSize: 10, color: "#475569", fontWeight: 700 }}>Vald</span> : <span style={{ fontSize: 18, color: "#22c55e", fontWeight: 300 }}>+</span>}
              </div>
            ); })}
          </div>
        </div>
      )}
      {plan.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: "#4a5568", fontWeight: 700, marginBottom: 6 }}>NOTERING</div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Hur gick det? Vad ska vi jobba mer på?" style={{ width: "100%", minHeight: 76, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", fontSize: 13, padding: 12, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6, marginBottom: 12 }} />
          <button onClick={handleSave} style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 13, background: saved ? "#34d399" : "#22c55e", color: "#0b0d14", fontSize: 15, fontWeight: 900, fontFamily: "inherit", cursor: "pointer" }}>{saved ? "Sparad! ✓" : "Spara träning"}</button>
        </>
      )}
    </div>
  );
}
