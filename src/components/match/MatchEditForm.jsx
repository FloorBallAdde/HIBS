import { useState } from "react";
import { sbPatch } from "../../lib/supabase.js";

// Formulär för att redigera ett avslutat matchresultat.
// Extraherat från MatchCard.jsx (Sprint 24 refactoring).
export default function MatchEditForm({ match, matchPlayers, tok, onSaved, onCancel }) {
  const [editResult, setEditResult] = useState(() => {
    const us = parseInt(match.result?.us);
    const them = parseInt(match.result?.them);
    return { us: isNaN(us) ? 0 : us, them: isNaN(them) ? 0 : them };
  });
  const [editScorers, setEditScorers] = useState([...(match.scorers || [])]);
  const [editTeamGoals, setEditTeamGoals] = useState(() => {
    const tg = match.teamGoals || [];
    return [tg[0] || "", tg[1] || "", tg[2] || ""];
  });
  const [editNote, setEditNote] = useState(match.note || "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const saveEdit = async () => {
    setSaving(true);
    setSaveError(null);
    const teamGoals = editTeamGoals.map(g => g.trim()).filter(Boolean);
    const patch = { result: editResult, scorers: editScorers, teamGoals, note: editNote };
    try {
      const res = await sbPatch("matches", match.id, patch, tok);
      if (res && !Array.isArray(res) && res.code) {
        setSaveError("Sparandet misslyckades: " + (res.message || res.code));
        setSaving(false);
        return;
      }
      onSaved?.({ ...match, result: editResult, scorers: editScorers, teamGoals, note: editNote });
    } catch (e) {
      setSaveError("Nätverksfel — försök igen");
    }
    setSaving(false);
  };

  return (
    <div style={{ padding: "0 16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginTop: 14, marginBottom: 10 }}>REDIGERA RESULTAT</div>

      {/* Resultat-editor */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 12, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, marginBottom: 8 }}>HIBS</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <button onClick={() => setEditResult(r => ({ ...r, us: Math.max(0, r.us - 1) }))} style={{ width: 36, height: 36, border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 20, fontFamily: "inherit", cursor: "pointer" }}>-</button>
            <span style={{ fontSize: 30, fontWeight: 900, color: "#fff", minWidth: 32, textAlign: "center" }}>{editResult.us}</span>
            <button onClick={() => setEditResult(r => ({ ...r, us: r.us + 1 }))} style={{ width: 36, height: 36, border: "none", borderRadius: "50%", background: "#22c55e", color: "#0b0d14", fontSize: 20, fontFamily: "inherit", cursor: "pointer", fontWeight: 700 }}>+</button>
          </div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 12, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#f87171", fontWeight: 700, marginBottom: 8 }}>MOT</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <button onClick={() => setEditResult(r => ({ ...r, them: Math.max(0, r.them - 1) }))} style={{ width: 36, height: 36, border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 20, fontFamily: "inherit", cursor: "pointer" }}>-</button>
            <span style={{ fontSize: 30, fontWeight: 900, color: "#fff", minWidth: 32, textAlign: "center" }}>{editResult.them}</span>
            <button onClick={() => setEditResult(r => ({ ...r, them: r.them + 1 }))} style={{ width: 36, height: 36, border: "none", borderRadius: "50%", background: "#f87171", color: "#fff", fontSize: 20, fontFamily: "inherit", cursor: "pointer", fontWeight: 700 }}>+</button>
          </div>
        </div>
      </div>

      {/* Målgörare/assist — visas bara om vi har matchspelare */}
      {matchPlayers.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700, marginBottom: 6 }}>MÅL</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {matchPlayers.map(p => {
              const cnt = editScorers.filter(s => s.name === p.name && s.type === "goal").length;
              return (
                <button key={p.id} onClick={() => setEditScorers(s => [...s, { name: p.name, type: "goal" }])} style={{ padding: "6px 12px", border: "1px solid " + (cnt > 0 ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.07)"), borderRadius: 99, background: cnt > 0 ? "rgba(251,191,36,0.1)" : "transparent", color: cnt > 0 ? "#fbbf24" : "#4a5568", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                  {p.name}{cnt > 0 ? " (" + cnt + ")" : ""}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: "#38bdf8", fontWeight: 700, marginBottom: 6 }}>ASSIST</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {matchPlayers.map(p => {
              const cnt = editScorers.filter(s => s.name === p.name && s.type === "assist").length;
              return (
                <button key={p.id} onClick={() => setEditScorers(s => [...s, { name: p.name, type: "assist" }])} style={{ padding: "6px 12px", border: "1px solid " + (cnt > 0 ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.07)"), borderRadius: 99, background: cnt > 0 ? "rgba(56,189,248,0.1)" : "transparent", color: cnt > 0 ? "#38bdf8" : "#4a5568", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                  {p.name}{cnt > 0 ? " (" + cnt + ")" : ""}
                </button>
              );
            })}
          </div>
          {editScorers.length > 0 && (
            <button onClick={() => setEditScorers(s => s.slice(0, -1))} style={{ padding: "7px 14px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 99, background: "transparent", color: "#4a5568", fontSize: 11, fontFamily: "inherit", cursor: "pointer", marginBottom: 14, display: "block" }}>Ångra senaste</button>
          )}
        </>
      )}

      {/* Notering */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginBottom: 6 }}>NOTERING</div>
        <textarea
          value={editNote}
          onChange={e => setEditNote(e.target.value)}
          placeholder="T.ex. bra press, jobbig domare, fantastisk energi..."
          style={{ width: "100%", minHeight: 70, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 10, color: "#fff", fontSize: 12, padding: "9px 12px", fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Lagmål — redigerbara fält */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, marginBottom: 6 }}>LAGMÅL</div>
        {editTeamGoals.map((g, i) => (
          <input key={i} value={g} onChange={e => setEditTeamGoals(gs => gs.map((x, j) => j === i ? e.target.value : x))}
            placeholder={"Mål " + (i + 1) + " — t.ex. Pressa högt"}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10, color: "#fff", fontSize: 12, padding: "9px 12px", fontFamily: "inherit", outline: "none", marginBottom: 6, boxSizing: "border-box" }}
          />
        ))}
      </div>

      {saveError && (
        <div style={{ fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "8px 12px", marginBottom: 10 }}>
          ⚠ {saveError}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={saveEdit} disabled={saving} style={{ flex: 2, padding: "14px 0", border: "none", borderRadius: 12, background: saving ? "rgba(34,197,94,0.3)" : "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 14, fontWeight: 800, fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Sparar..." : "Spara"}
        </button>
        <button onClick={onCancel} style={{ flex: 1, padding: "14px 0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "transparent", color: "#4a5568", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>Avbryt</button>
      </div>
    </div>
  );
}
