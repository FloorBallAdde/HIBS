/**
 * ChecklistView — Lagmål och checklistor i Mer-fliken.
 * Extraherad från MerContent.jsx i Sprint 36.
 */
export default function ChecklistView({ checklist, setChecklist }) {
  return (
    <div>
      {checklist.map((cat, ci) => (
        <div key={ci} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + cat.color + "25", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: cat.color, marginBottom: 12 }}>{cat.category.toUpperCase()}</div>
          {cat.items.map(item => (
            <div key={item.id} onClick={() => setChecklist(c => c.map((cc, i) => i === ci ? { ...cc, items: cc.items.map(x => x.id === item.id ? { ...x, done: !x.done } : x) } : cc))} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, border: "1.5px solid " + (item.done ? cat.color : "rgba(255,255,255,0.15)"), background: item.done ? cat.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                {item.done && <span style={{ fontSize: 10, color: "#0b0d14", fontWeight: 900 }}>{"\u2713"}</span>}
              </div>
              <span style={{ fontSize: 13, color: item.done ? "#4a5568" : "#cbd5e1", lineHeight: 1.4, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
