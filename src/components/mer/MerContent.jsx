import { useState } from "react";
import { GROUPS, GC, gc, FITNESS_META, nextFitness } from "../../lib/constants.js";
import MatchCard from "../match/MatchCard.jsx";

const ALL_GROUPS = [...GROUPS, "MV"]; // A B C D E MV

function GrupperDnD({ players, updP }) {
  const [dragId, setDragId] = useState(null);
  const [overGroup, setOverGroup] = useState(null);

  const onDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const onDragOver = (e, g) => { e.preventDefault(); setOverGroup(g); };
  const onDragLeave = () => setOverGroup(null);
  const onDrop = (e, g) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    if (id) updP(id, { group: g });
    setDragId(null); setOverGroup(null);
  };
  const onDragEnd = () => { setDragId(null); setOverGroup(null); };

  const unassigned = players.filter(p => !ALL_GROUPS.includes(p.group));

  return (
    <div>
      <div style={{ fontSize: 11, color: "#4a5568", marginBottom: 14 }}>
        Dra spelare mellan grupper, eller tryck på ett namn och välj grupp.
      </div>
      {ALL_GROUPS.map(g => {
        const inGroup = players.filter(p => p.group === g);
        const col = GC[g] || GC._;
        const isOver = overGroup === g;
        return (
          <div key={g}
            onDragOver={e => onDragOver(e, g)}
            onDragLeave={onDragLeave}
            onDrop={e => onDrop(e, g)}
            style={{
              marginBottom: 12,
              borderRadius: 14,
              border: "1.5px solid " + (isOver ? col.color : "rgba(255,255,255,0.07)"),
              background: isOver ? col.bg : "rgba(255,255,255,0.02)",
              padding: "10px 12px",
              transition: "border-color 0.15s, background 0.15s",
              minHeight: 54,
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: inGroup.length ? 8 : 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, background: col.bg, border: "1.5px solid " + col.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: col.color }}>{g}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: col.color }}>Grupp {g}</span>
              <span style={{ fontSize: 11, color: "#4a5568" }}>· {inGroup.length} sp.</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {inGroup.map(p => (
                <PlayerChip key={p.id} p={p} col={col} isDragging={dragId === p.id}
                  onDragStart={onDragStart} onDragEnd={onDragEnd} updP={updP} />
              ))}
              {inGroup.length === 0 && (
                <span style={{ fontSize: 11, color: "#2d3748", fontStyle: "italic" }}>Dra hit…</span>
              )}
            </div>
          </div>
        );
      })}
      {unassigned.length > 0 && (
        <div style={{ marginTop: 4, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#4a5568", marginBottom: 6 }}>Utan grupp</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {unassigned.map(p => (
              <PlayerChip key={p.id} p={p} col={GC._} isDragging={dragId === p.id}
                onDragStart={onDragStart} onDragEnd={onDragEnd} updP={updP} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerChip({ p, col, isDragging, onDragStart, onDragEnd, updP }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <div
        draggable
        onDragStart={e => onDragStart(e, p.id)}
        onDragEnd={onDragEnd}
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "6px 12px",
          borderRadius: 99,
          background: isDragging ? "rgba(255,255,255,0.12)" : col.bg,
          border: "1.5px solid " + (isDragging ? "rgba(255,255,255,0.3)" : col.color),
          color: isDragging ? "#94a3b8" : col.color,
          fontSize: 12, fontWeight: 700,
          cursor: "grab",
          userSelect: "none",
          opacity: isDragging ? 0.5 : 1,
          transition: "opacity 0.15s",
        }}>
        {p.name}
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: "#1e2235", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: 6, display: "flex", gap: 4, zIndex: 50 }}>
          {ALL_GROUPS.map(ng => {
            const ngc = GC[ng] || GC._;
            const active = p.group === ng;
            return (
              <button key={ng} onClick={() => { updP(p.id, { group: ng }); setOpen(false); }}
                style={{ width: 30, height: 30, border: "1.5px solid " + (active ? ngc.color : "rgba(255,255,255,0.1)"), borderRadius: 7, background: active ? ngc.bg : "transparent", color: active ? ngc.color : "#4a5568", fontSize: 10, fontWeight: 900, fontFamily: "inherit", cursor: "pointer" }}>
                {ng}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * MerContent — "Mer"-fliken med spelare, lagmål, matchhistorik, säsongsplan.
 * Extraherad från App.jsx i Sprint 3.
 * Sprint 11: P10 fitness-badge + P9 observations-knapp tillagda.
 */
export default function MerContent({
  pendingCoaches, setPendingCoaches, merSub, setMerSub,
  players, filterGroup, setFilterGroup,
  setNoteModal, setGoalModal, setObsModal,
  checklist, setChecklist,
  history, setHistory, setMatchNoteModal,
  roadmap, setRoadmap, openPeriod, setOpenPeriod,
  tok, sbPatch, sbDel, updP,
}) {
  return (
    <div>
      {pendingCoaches.length > 0 && !merSub && (
        <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700, marginBottom: 10 }}>VÄNTANDE TRÄNARE</div>
          {pendingCoaches.map(pc => (
            <div key={pc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>{pc.username}</span>
              <button onClick={async () => { await sbPatch("profiles", pc.id, { approved: true }, tok); setPendingCoaches(p => p.filter(x => x.id !== pc.id)); }} style={{ padding: "6px 14px", border: "none", borderRadius: 99, background: "#22c55e", color: "#0b0d14", fontSize: 11, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>Godkänn</button>
            </div>
          ))}
        </div>
      )}
      {!merSub && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["spelare",       "👥", "Spelarlista",        "Se alla spelare, noter och observationer"],
            ["grupper",       "🔀", "Grupper & kedjor",   "Placera spelare i grupp A, B, C eller MV"],
            ["lagmal",        "🎯", "Lagmål och checklist","Säsongens mål och checklistor"],
            ["matchhistorik", "📊", "Matchhistorik",      "Alla spelade matcher"],
            ["sasongsplan",   "🗓", "Säsongsplan",        "Periodsplan för säsongen"],
          ].map(([id, icon, label, desc]) => (
            <button key={id} onClick={() => setMerSub(id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{label}</div>
                <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>{desc}</div>
              </div>
              <span style={{ marginLeft: "auto", color: "#4a5568", fontSize: 16, flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      )}

      {merSub === "spelare" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
            {["ALL", ...GROUPS, "MV"].map(g => <button key={g} onClick={() => setFilterGroup(g)} style={{ padding: "5px 12px", border: "1px solid " + (filterGroup === g ? (g === "ALL" ? "#22c55e" : gc(g).color) : "rgba(255,255,255,0.07)"), borderRadius: 99, background: filterGroup === g ? (g === "ALL" ? "rgba(34,197,94,0.12)" : gc(g).bg) : "transparent", color: filterGroup === g ? (g === "ALL" ? "#22c55e" : gc(g).color) : "#4a5568", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}>{g === "ALL" ? "Alla" : "Gr." + g}</button>)}
          </div>
          {players.filter(p => filterGroup === "ALL" || p.group === filterGroup).map(p => {
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
                        <span style={{ fontSize: 10, color: pgc.color }}>Gr.{p.group} · {p.matches || 0} m</span>
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
                {hasNote && <div style={{ fontSize: 12, color: p.note.startsWith("⚠") ? "#fca5a5" : "#64748b", background: p.note.startsWith("⚠") ? "rgba(248,113,113,0.06)" : "rgba(255,255,255,0.02)", borderRadius: 8, padding: "6px 10px" }}>{p.note}</div>}
              </div>
            );
          })}
        </div>
      )}

      {merSub === "grupper" && <GrupperDnD players={players} updP={updP} />}

      {merSub === "lagmal" && (
        <div>
          {checklist.map((cat, ci) => (
            <div key={ci} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + cat.color + "25", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: cat.color, marginBottom: 12 }}>{cat.category.toUpperCase()}</div>
              {cat.items.map(item => (
                <div key={item.id} onClick={() => setChecklist(c => c.map((cc, i) => i === ci ? { ...cc, items: cc.items.map(x => x.id === item.id ? { ...x, done: !x.done } : x) } : cc))} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: "1.5px solid " + (item.done ? cat.color : "rgba(255,255,255,0.15)"), background: item.done ? cat.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {item.done && <span style={{ fontSize: 10, color: "#0b0d14", fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, color: item.done ? "#4a5568" : "#cbd5e1", lineHeight: 1.4, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {merSub === "matchhistorik" && (
        <div>
          {history.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: "#334155", fontSize: 14 }}>Inga matcher sparade ännu.</div>}
          {history.map(m => (
            <MatchCard key={m.id} match={m}
              players={players}
              tok={tok}
              onEditNote={match => setMatchNoteModal(match)}
              onDelete={async id => { await sbDel("matches", id, tok); setHistory(p => p.filter(x => x.id !== id)); }}
              onUpdate={updated => setHistory(p => p.map(x => x.id === updated.id ? updated : x))}
            />
          ))}
        </div>
      )}

      {merSub === "sasongsplan" && (
        <div>
          {roadmap.map((period, pi) => {
            const done = period.tasks.filter(t => t.done).length;
            const isOpen = openPeriod === pi;
            return (
              <div key={pi} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + period.color + "25", borderRadius: 16, overflow: "hidden", marginBottom: 10 }}>
                <div onClick={() => setOpenPeriod(isOpen ? null : pi)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: "pointer" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: period.color }}>{period.label}</span>
                      <span style={{ fontSize: 11, color: "#4a5568" }}>{period.period}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#4a5568", marginTop: 3 }}>{done}/{period.tasks.length} klara</div>
                  </div>
                  <span style={{ color: "#4a5568" }}>{isOpen ? "▲" : "▼"}</span>
                </div>
                {isOpen && period.tasks.map(task => (
                  <div key={task.id} onClick={() => setRoadmap(r => r.map((pp, i) => i === pi ? { ...pp, tasks: pp.tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t) } : pp))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: "1.5px solid " + (task.done ? period.color : "rgba(255,255,255,0.15)"), background: task.done ? period.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {task.done && <span style={{ fontSize: 10, color: "#0b0d14", fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: task.done ? "#4a5568" : "#cbd5e1", textDecoration: task.done ? "line-through" : "none" }}>{task.text}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
