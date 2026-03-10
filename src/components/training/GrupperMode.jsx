import { useState } from "react";
import { GROUPS, GC, gc } from "../../lib/constants.js";

export default function GrupperMode({ field, onUpdateGroup }) {
  const [localGroups, setLocalGroups] = useState(() => { const m = {}; field.forEach(p => { m[p.id] = p.group; }); return m; });
  const [editing, setEditing] = useState(null);
  const [dirty, setDirty] = useState(new Set());

  const changeGroup = (id, g) => {
    setLocalGroups(m => ({ ...m, [id]: g }));
    setDirty(d => new Set(d).add(id));
  };

  const saveAll = async () => {
    for (const id of dirty) {
      await onUpdateGroup(id, localGroups[id]);
    }
    setDirty(new Set());
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>Grupper</div>
        {dirty.size > 0 && (
          <button onClick={saveAll} style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 99, padding: "6px 14px", fontFamily: "inherit", cursor: "pointer" }}>Spara ({dirty.size})</button>
        )}
      </div>
      {GROUPS.map(g => {
        const gp = field.filter(p => localGroups[p.id] === g);
        if (!gp.length) return null;
        return (
          <div key={g} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: GC[g].color, letterSpacing: "0.1em", marginBottom: 7 }}>GRUPP {g} ({gp.length})</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {gp.map(p => {
                const isEditing = editing === p.id;
                const changed = dirty.has(p.id);
                return (
                  <div key={p.id} style={{ position: "relative" }}>
                    <button onClick={() => setEditing(isEditing ? null : p.id)} style={{ padding: "8px 15px", border: "1.5px solid " + (changed ? "#22c55e" : GC[g].color), borderRadius: 99, background: changed ? "rgba(34,197,94,0.08)" : GC[g].bg, color: changed ? "#22c55e" : GC[g].color, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>{p.name}</button>
                    {isEditing && (
                      <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: "#1e2235", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: 6, display: "flex", gap: 4, zIndex: 50 }}>
                        {GROUPS.map(ng => (
                          <button key={ng} onClick={() => { changeGroup(p.id, ng); setEditing(null); }} style={{ width: 28, height: 28, border: "1.5px solid " + (ng === localGroups[p.id] ? GC[ng].color : "rgba(255,255,255,0.1)"), borderRadius: 7, background: ng === localGroups[p.id] ? GC[ng].bg : "transparent", color: ng === localGroups[p.id] ? GC[ng].color : "#4a5568", fontSize: 11, fontWeight: 900, fontFamily: "inherit", cursor: "pointer" }}>{ng}</button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
