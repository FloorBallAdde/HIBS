import { useState } from "react";
import { FMT } from "../../lib/constants.js";
import MatchEditForm from "./MatchEditForm.jsx";

export default function MatchCard({ match, players, tok, onEditNote, onDelete, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const sc = match.serie === "14A" ? "#f472b6" : match.serie === "15A" ? "#38bdf8" : "#fbbf24";
  // hasResult kräver att BÅDA är satta
  const hasResult = match.result && match.result.us !== "" && match.result.them !== "";
  const scorers = match.scorers || [];
  const isObj = scorers.length > 0 && typeof scorers[0] === "object";
  const goals = isObj ? scorers.filter(s => s.type === "goal") : scorers;
  const assists = isObj ? scorers.filter(s => s.type === "assist") : [];
  const substitutions = match.substitutions || [];

  // Spelare som deltog i matchen
  const matchPlayers = (players || []).filter(p =>
    (match.players || []).includes(p.id) || (match.goalkeeper || []).includes(p.id)
  );

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
          {/* Byten (Sprint 24) */}
          {substitutions.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700, marginBottom: 5 }}>BYTEN</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {substitutions.map((s, i) => (
                  <span key={i} style={{ fontSize: 12, color: "#a78bfa", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 99, padding: "3px 10px" }}>
                    ↕ {s.outName} → {s.inName}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Kedjor (Sprint 31) */}
          {(match.lines2 || []).filter(l => Object.values(l.slots || {}).some(Boolean)).length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#34d399", fontWeight: 700, marginBottom: 5 }}>KEDJOR</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {match.lines2.filter(l => Object.values(l.slots || {}).some(Boolean)).map((line, i) => {
                  const names = ["forward", "vanster", "hoger", "back"]
                    .map(pos => line.slots?.[pos])
                    .filter(Boolean);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, color: "#64748b", fontWeight: 800, flexShrink: 0 }}>{line.name}</span>
                      <span style={{ fontSize: 12, color: "#34d399" }}>{names.join(" · ")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Notering */}
          {match.note && (
            <div style={{ fontSize: 12, color: "#94a3b8", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 12px", marginBottom: 10, lineHeight: 1.5 }}>{match.note}</div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <button onClick={() => { setEditing(true); setOpen(true); }} style={{ padding: "7px 14px", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 99, background: "rgba(34,197,94,0.08)", color: "#22c55e", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>✏ Redigera</button>
            <button onClick={() => onEditNote(match)} style={{ padding: "7px 14px", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 99, background: "rgba(167,139,250,0.06)", color: "#a78bfa", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>📋 Kopiera för Claude</button>
            {!confirmDel
              ? <button onClick={() => setConfirmDel(true)} style={{ padding: "7px 14px", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 99, background: "transparent", color: "#f87171", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>Ta bort</button>
              : <button onClick={() => { onDelete(match.id); setConfirmDel(false); }} style={{ padding: "7px 14px", border: "none", borderRadius: 99, background: "#f87171", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Bekräfta borttagning</button>
            }
          </div>
        </div>
      )}

      {/* ── EDIT MODE (extraherat till MatchEditForm — Sprint 24) ── */}
      {editing && (
        <MatchEditForm
          match={match}
          matchPlayers={matchPlayers}
          tok={tok}
          onSaved={(updated) => { onUpdate?.(updated); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}
