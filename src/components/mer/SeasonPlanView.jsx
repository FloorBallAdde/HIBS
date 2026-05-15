/**
 * SeasonPlanView — Säsongsplan (roadmap) i Mer-fliken.
 * Extraherad från MerContent.jsx i Sprint 36.
 * Accordion-UI med perioder och uppgifter som kan checkas av.
 */
export default function SeasonPlanView({ roadmap, setRoadmap, openPeriod, setOpenPeriod }) {
  return (
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
              <span style={{ color: "#4a5568" }}>{isOpen ? "\u25B2" : "\u25BC"}</span>
            </div>
            {isOpen && period.tasks.map(task => (
              <div key={task.id} onClick={() => setRoadmap(r => r.map((pp, i) => i === pi ? { ...pp, tasks: pp.tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t) } : pp))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: "1.5px solid " + (task.done ? period.color : "rgba(255,255,255,0.15)"), background: task.done ? period.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {task.done && <span style={{ fontSize: 10, color: "#0b0d14", fontWeight: 900 }}>{"\u2713"}</span>}
                </div>
                <span style={{ fontSize: 13, color: task.done ? "#4a5568" : "#cbd5e1", textDecoration: task.done ? "line-through" : "none" }}>{task.text}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
