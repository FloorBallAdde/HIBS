import { useState } from "react";
import { GROUPS, GC, gc, shuffle, CHAIN_POS, CHAIN_COL } from "../../lib/constants.js";

/**
 * BlandaMode — Tre valbara blandningslägen:
 *   1. Inom grupper  — shufflar positioner inom varje grupp (nya kedjor av samma grupp)
 *   2. Mellan grupper — flyttar spelare slumpmässigt mellan grupperna
 *   3. Helt slumpmässig — ignorerar grupper, slumpar alla till nya kedjor
 */
export default function BlandaMode({ field }) {
  const [size, setSize] = useState(4);
  const [mixMode, setMixMode] = useState(null);
  const [results, setResults] = useState([]);

  const MIX_MODES = [
    { id: "within", label: "Inom grupper", desc: "Nya kedjor inom varje grupp", color: "#22c55e" },
    { id: "between", label: "Mellan grupper", desc: "Spelare blandas mellan 2 grupper", color: "#a78bfa" },
    { id: "random", label: "Helt slumpmässigt", desc: "Alla blandas i nya kedjor", color: "#f472b6" },
  ];

  const doMix = (mode) => {
    setMixMode(mode);

    if (mode === "within") {
      // Shuffla spelare inom varje grupp till kedjor
      const res = [];
      GROUPS.forEach(g => {
        const gp = field.filter(p => p.group === g);
        if (gp.length < 2) return;
        const s = shuffle(gp.map(p => p.id));
        const chains = [];
        for (let i = 0; i < s.length; i += size) chains.push(s.slice(i, i + size));
        res.push({ label: "Grupp " + g, color: GC[g]?.color || "#64748b", chains });
      });
      setResults(res);

    } else if (mode === "between") {
      // Blanda spelare från par av grupper
      const groupList = GROUPS.filter(g => field.some(p => p.group === g));
      const res = [];
      // Skapa alla unika par
      for (let i = 0; i < groupList.length; i++) {
        for (let j = i + 1; j < groupList.length; j++) {
          const g1 = groupList[i], g2 = groupList[j];
          const pool = field.filter(p => p.group === g1 || p.group === g2);
          if (pool.length < 2) continue;
          const s = shuffle(pool.map(p => p.id));
          const chains = [];
          for (let k = 0; k < s.length; k += size) chains.push(s.slice(k, k + size));
          res.push({ label: "Grupp " + g1 + " + " + g2, color: "#a78bfa", chains });
        }
      }
      setResults(res);

    } else if (mode === "random") {
      // Ignorera grupper — blanda alla
      const s = shuffle(field.map(p => p.id));
      const chains = [];
      for (let i = 0; i < s.length; i += size) chains.push(s.slice(i, i + size));
      setResults([{ label: "Alla spelare", color: "#f472b6", chains }]);
    }
  };

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 14 }}>Blanda grupper</div>

      {/* Kedjestorlek */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 14 }}>Kedjestorlek</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[3, 4, 5].map(n => (
            <button key={n} onClick={() => setSize(n)} style={{ flex: 1, padding: "12px 0", border: "2px solid " + (size === n ? "#22c55e" : "rgba(255,255,255,0.07)"), borderRadius: 12, background: size === n ? "rgba(34,197,94,0.12)" : "transparent", color: size === n ? "#22c55e" : "#4a5568", fontSize: 16, fontWeight: 900, fontFamily: "inherit", cursor: "pointer" }}>{n}v{n}</button>
          ))}
        </div>
      </div>

      {/* Blandningslägen */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {MIX_MODES.map(m => (
          <button
            key={m.id}
            onClick={() => doMix(m.id)}
            style={{
              width: "100%",
              padding: "16px 18px",
              border: "2px solid " + (mixMode === m.id ? m.color : "rgba(255,255,255,0.07)"),
              borderRadius: 14,
              background: mixMode === m.id ? m.color + "18" : "rgba(255,255,255,0.02)",
              color: mixMode === m.id ? m.color : "#94a3b8",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "inherit",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span>{m.label}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: mixMode === m.id ? m.color + "cc" : "#4a5568" }}>{m.desc}</span>
          </button>
        ))}
      </div>

      {/* Resultat */}
      {results.map((r, ri) => (
        <div key={ri} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: r.color, marginBottom: 8 }}>{r.label.toUpperCase()}</div>
          {r.chains.map((chain, ci) => (
            <div key={ci} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
              <div style={{ background: r.color + "12", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "6px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: r.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: r.color }}>{ci + 1}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>Kedja {ci + 1}</span>
              </div>
              {chain.map((id, pi) => {
                const p = field.find(x => x.id === id);
                if (!p) return null;
                const pos = CHAIN_POS[pi] || ("Pos " + (pi + 1));
                const pc = CHAIN_COL[pos] || "#64748b";
                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px", borderBottom: pi < chain.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: pc, background: pc + "15", border: "1px solid " + pc + "30", borderRadius: 5, padding: "2px 5px", width: 32, textAlign: "center" }}>{pos}</span>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: gc(p.group).color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{p.name}</span>
                    <span style={{ fontSize: 9, color: "#4a5568", marginLeft: "auto" }}>{p.group}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}

      {/* Re-blanda knapp om vi har resultat */}
      {results.length > 0 && mixMode && (
        <button onClick={() => doMix(mixMode)} style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 13, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", color: "#fff", fontSize: 14, fontWeight: 900, fontFamily: "inherit", cursor: "pointer", marginBottom: 20 }}>Blanda igen</button>
      )}
    </div>
  );
}
