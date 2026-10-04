import { useState } from "react";
import { GROUPS, GC, gc, FITNESS_META, nextFitness, groupShort, posLabel, PCOLOR, LINE_FORMATS } from "../../lib/constants.js";

// Sprint 83: sortera på lina, sedan position (1:a, H2, V2, H3, V3), sist utan position
const posOrder = (p) => { const i = LINE_FORMATS[5].indexOf(p.position); return i < 0 ? 9 : i; };
const byLinePos = (a, b) => (a.group || "Z").localeCompare(b.group || "Z") || posOrder(a) - posOrder(b) || a.name.localeCompare(b.name, "sv");

/**
 * PlayerListView — Spelarlistan i Mer-fliken.
 * Extraherad från MerContent.jsx i Sprint 35.
 * Visar spelare med gruppfilter, fitness-badge, noter och action-knappar.
 * Sprint 74: gruppbyte flyttat hit (tryck på Gr.X) — ersätter Mer → Grupper & kedjor.
 */
export default function PlayerListView({
  players, filterGroup, setFilterGroup,
  setNoteModal, setGoalModal, setObsModal,
  updP,
}) {
  // Sprint 74: vilken spelares grupp-picker som är öppen (id eller null)
  const [pickerFor, setPickerFor] = useState(null);
  const ALL_GROUPS = [...GROUPS, "MV"];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {["ALL", ...GROUPS, "MV"].map(g => (
          <button
            key={g}
            onClick={() => setFilterGroup(g)}
            style={{
              padding: "5px 12px",
              border: "1px solid " + (filterGroup === g ? (g === "ALL" ? "#22c55e" : gc(g).color) : "rgba(255,255,255,0.07)"),
              borderRadius: 99,
              background: filterGroup === g ? (g === "ALL" ? "rgba(34,197,94,0.12)" : gc(g).bg) : "transparent",
              color: filterGroup === g ? (g === "ALL" ? "#22c55e" : gc(g).color) : "#4a5568",
              fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            {g === "ALL" ? "Alla" : groupShort(g)}
          </button>
        ))}
      </div>
      {players.filter(p => filterGroup === "ALL" || p.group === filterGroup).sort(byLinePos).map(p => {
        const pgc = gc(p.group);
        const fm = FITNESS_META[p.fitness || "fit"];
        const obsCount = Array.isArray(p.observations) ? p.observations.length : 0;
        const hasNote = p.note && p.note.trim();
        return (
          <div key={p.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 14px", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hasNote ? 8 : 0 }}>
              {/* Left: avatar + name + fitness badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", background: pgc.bg, border: "1.5px solid " + pgc.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: pgc.color }}>{p.name.slice(0, 2).toUpperCase()}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <button
                      onClick={() => setPickerFor(f => f === p.id ? null : p.id)}
                      title="Tryck för att byta grupp"
                      style={{ padding: "1px 5px", borderRadius: 99, background: "transparent", border: "1px dashed " + pgc.color + "50", color: pgc.color, fontSize: 10, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", flexShrink: 0 }}
                    >
                      {groupShort(p.group)} ▾
                    </button>
                    {posLabel(p.position) && (
                      <span style={{ padding: "1px 6px", borderRadius: 6, background: PCOLOR[p.position] + "15", border: "1px solid " + PCOLOR[p.position] + "40", color: PCOLOR[p.position], fontSize: 10, fontWeight: 900, flexShrink: 0 }}>
                        {posLabel(p.position)}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: "#4a5568" }}>{p.matches || 0} m</span>
                    {/* Fitness badge — tap to cycle */}
                    <button
                      onClick={() => updP(p.id, { fitness: nextFitness(p.fitness) })}
                      title="Tryck för att byta status"
                      style={{ padding: "1px 5px", borderRadius: 99, background: fm.bg, border: "1px solid " + fm.color + "60", color: fm.color, fontSize: 9, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", flexShrink: 0 }}
                    >
                      {fm.emoji} {fm.label}
                    </button>
                  </div>
                </div>
              </div>
              {/* Right: action buttons */}
              <div style={{ display: "flex", gap: 4, flexShrink: 0, marginLeft: 6 }}>
                <button onClick={() => setNoteModal(p)} title="Notera skada/anmärkning" style={{ padding: "6px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#94a3b8", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>✏</button>
                <button onClick={() => setObsModal(p)} title="Tränarobservationer" style={{ padding: "6px 8px", background: obsCount ? "rgba(56,189,248,0.08)" : "rgba(255,255,255,0.04)", border: "1px solid " + (obsCount ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.08)"), borderRadius: 8, color: obsCount ? "#38bdf8" : "#94a3b8", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>
                  👁{obsCount > 0 ? <span style={{ fontSize: 9, marginLeft: 2 }}>{obsCount}</span> : null}
                </button>
                <button onClick={() => setGoalModal(p)} title="Individuella mål" style={{ padding: "6px 8px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 8, color: "#a78bfa", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>🎯</button>
              </div>
            </div>
            {/* Sprint 74: inline grupp-picker A–E/MV */}
            {pickerFor === p.id && (
              <div style={{ display: "flex", gap: 6, marginTop: 8, marginBottom: hasNote ? 8 : 0 }}>
                {ALL_GROUPS.map(ng => {
                  const ngc = GC[ng] || GC._;
                  const active = p.group === ng;
                  return (
                    <button
                      key={ng}
                      onClick={() => { if (ng !== p.group) updP(p.id, { group: ng, position: null }); setPickerFor(null); }}
                      style={{ flex: 1, minHeight: 40, border: "1.5px solid " + (active ? ngc.color : "rgba(255,255,255,0.1)"), borderRadius: 9, background: active ? ngc.bg : "transparent", color: active ? ngc.color : "#4a5568", fontSize: 11, fontWeight: 900, fontFamily: "inherit", cursor: "pointer" }}
                    >
                      {groupShort(ng)}
                    </button>
                  );
                })}
              </div>
            )}
            {hasNote && <div style={{ fontSize: 12, color: p.note.startsWith("⚠") ? "#fca5a5" : "#64748b", background: p.note.startsWith("⚠") ? "rgba(248,113,113,0.06)" : "rgba(255,255,255,0.02)", borderRadius: 8, padding: "6px 10px" }}>{p.note}</div>}
          </div>
        );
      })}
    </div>
  );
}
