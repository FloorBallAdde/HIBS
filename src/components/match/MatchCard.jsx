import { useState } from "react";
import { FMT } from "../../lib/constants.js";
import { sbPatch } from "../../lib/supabase.js";

export default function MatchCard({ match, players, tok, onEditNote, onDelete, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editResult, setEditResult] = useState({ us: 0, them: 0 });
  const [editScorers, setEditScorers] = useState([]);
  const [editTeamGoals, setEditTeamGoals] = useState(["", "", ""]);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const sc = match.serie === "14A" ? "#f472b6" : match.serie === "15A" ? "#38bdf8" : "#fbbf24";
  // hasResult kräver att BÅDA är satta
  const hasResult = match.result && match.result.us !== "" && match.result.them !== "";
  const scorers = match.scorers || [];
  const isObj = scorers.length > 0 && typeof scorers[0] === "object";
  const goals = isObj ? scorers.filter(s => s.type === "goal") : scorers;
  const assists = isObj ? scorers.filter(s => s.type === "assist") : [];

  // Spelare som deltog i matchen
  const matchPlayers = (players || []).filter(p =>
    (match.players || []).includes(p.id) || (match.goalkeeper || []).includes(p.id)
  );

  const startEdit = () => {
    // Konvertera "" → 0 så +/- fungerar direkt
    const us = parseInt(match.result?.us);
    const them = parseInt(match.result?.them);
    setEditResult({ us: isNaN(us) ? 0 : us, them: isNaN(them) ? 0 : them });
    setEditScorers([...(match.scorers || [])]);
    // Fyll lagmål med befintliga värden (eller tomma fält om de saknas)
    const tg = match.teamGoals || [];
    setEditTeamGoals([tg[0] || "", tg[1] || "", tg[2] || ""]);
    setEditing(true);
    setOpen(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    const teamGoals = editTeamGoals.map(g => g.trim()).filter(Boolean);
    const patch = { result: editResult, scorers: editScorers, teamGoals };
    try {
      await sbPatch("matches", match.id, patch, tok);
      onUpdate?.({ ...match, ...patch });
      setEditing(false);
    } catch (e) {
      // Behåll edit-läge om sparandet misslyckas
    }
    setSaving(false);
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden", marginBottom: 10 }}>

      {/* ── HEADER ── */}
      <div onClick={() => !editing && setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: editing ? "default" : "pointer" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: sc, background: sc + "18", border: "1px solid " + sc + "40", borderRadius: 99, padding: "2px 8px" }}>{match.serie}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>vs {match.opponent}</span>
            {hasResult
              ? <span style={{ fontSize: 12, fontWeight: 900, color: "#fff", background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "2px 8px" }}>{match.result.us}-{match.result.them}</span>
              : <span style={{ fontSize: 11, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "2px 6px" }}>Ej ifyllt</span>
            }
          </div>
          <span style={{ fontSize: 11, color: "#4a5568" }}>{FMT(match.date)}</span>
        </div>
        {!editing && <span style={{ color: "#4a5568", fontSize: 13 }}>{open ? "▲" : "▼"}</span>}
      </div>

      {/* ── VIEW MODE ── */}
      {open && !editing && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Lagmål */}
          {(match.teamGoals || []).length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#22c55e", fontWeight: 700, marginBottom: 5 }}>LAGMÅL</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {match.teamGoals.map((g, i) => (
                  <span key={i} style={{ fontSize: 12, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 99, padding: "3px 10px" }}>{g}</span>
                ))}
              </div>
            </div>
          )}
          {/* Mål */}
          {goals.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#fbbf24", fontWeight: 700, marginBottom: 5 }}>MÅL</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {goals.map((s, i) => <span key={i} style={{ fontSize: 12, color: "#fbbf24", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 99, padding: "3px 10px" }}>{isObj ? s.name : s}</span>)}
              </div>
            </div>
          )}
          {/* Assist */}
          {assists.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#38bdf8", fontWeight: 700, marginBottom: 5 }}>ASSIST</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {assists.map((s, i) => <span key={i} style={{ fontSize: 12, color: "#38bdf8", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 99, padding: "3px 10px" }}>{s.name}</span>)}
              </div>
            </div>
          )}
          {/* Notering */}
          {match.note && (
            <div style={{ fontSize: 12, color: "#94a3b8", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 12px", marginBottom: 10, lineHeight: 1.5 }}>{match.note}</div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <button onClick={startEdit} style={{ padding: "7px 14px", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 99, background: "rgba(34,197,94,0.08)", color: "#22c55e", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>✏ Redigera</button>
            <button onClick={() => onEditNote(match)} style={{ padding: "7px 14px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 99, background: "transparent", color: "#4a5568", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>📝 Notering</button>
            {!confirmDel
              ? <button onClick={() => setConfirmDel(true)} style={{ padding: "7px 14px", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 99, background: "transparent", color: "#f87171", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>Ta bort</button>
              : <button onClick={() => { onDelete(match.id); setConfirmDel(false); }} style={{ padding: "7px 14px", border: "none", borderRadius: 99, background: "#f87171", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Bekräfta borttagning</button>
            }
          </div>
        </div>
      )}

      {/* ── EDIT MODE ── */}
      {editing && (
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

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveEdit} disabled={saving} style={{ flex: 2, padding: "14px 0", border: "none", borderRadius: 12, background: saving ? "rgba(34,197,94,0.3)" : "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 14, fontWeight: 800, fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Sparar..." : "Spara"}
            </button>
            <button onClick={() => setEditing(false)} style={{ flex: 1, padding: "14px 0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "transparent", color: "#4a5568", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  );
}
