import { useState } from "react";
import { GROUPS, GC, gc, shuffle, CHAIN_POS, CHAIN_COL } from "../../lib/constants.js";

export default function BlandaMode({ field }) {
  const [size, setSize] = useState(4);
  const [results, setResults] = useState([]);
  const mixes = [new Set(["A", "B"]), new Set(["C", "D"]), new Set(["A", "C"]), new Set(["B", "D"]), new Set(["A", "D"]), new Set(["B", "C"])];

  const doScramble = () => {
    setResults(mixes.map(mixSet => {
      const pool = field.filter(p => mixSet.has(p.group));
      const s = shuffle(pool.map(p => p.id));
      const chains = [];
      for (let i = 0; i < s.length; i += size) chains.push(s.slice(i, i + size));
      return { mixSet, chains };
    }));
  };

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 14 }}>Blanda grupper</div>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 14 }}>Kedjestorlek</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[3, 4, 5].map(n => <button key={n} onClick={() => setSize(n)} style={{ flex: 1, padding: "12px 0", border: "2px solid " + (size === n ? "#22c55e" : "rgba(255,255,255,0.07)"), borderRadius: 12, background: size === n ? "rgba(34,197,94,0.12)" : "transparent", color: size === n ? "#22c55e" : "#4a5568", fontSize: 16, fontWeight: 900, fontFamily: "inherit", cursor: "pointer" }}>{n}v{n}</button>)}
        </div>
        <button onClick={doScramble} style={{ width: "100%", padding: "15px 0", border: "none", borderRadius: 13, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", color: "#fff", fontSize: 15, fontWeight: 900, fontFamily: "inherit", cursor: "pointer" }}>Blanda alla kombinationer</button>
      </div>
      {results.map((r, ri) => {
        const labels = [...r.mixSet].sort().join("+");
        return (
          <div key={ri} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#a78bfa", marginBottom: 8 }}>GRUPP {labels}</div>
            {r.chains.map((chain, ci) => (
              <div key={ci} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, marginBottom: 8, padding: "6px 0" }}>
                {chain.map((id, pi) => { const p = field.find(x => x.id === id); if (!p) return null; const pos = CHAIN_POS[pi] || ("Pos " + (pi + 1)); const pc = CHAIN_COL[pos] || "#64748b"; return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px" }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: pc, background: pc + "15", border: "1px solid " + pc + "30", borderRadius: 5, padding: "2px 5px", width: 32, textAlign: "center" }}>{pos}</span>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: gc(p.group).color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{p.name}</span>
                    <span style={{ fontSize: 9, color: "#4a5568", marginLeft: "auto" }}>{p.group}</span>
                  </div>
                ); })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
