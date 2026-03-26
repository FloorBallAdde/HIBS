import { useState, useEffect, useCallback } from "react";
import ls from "../../lib/storage.js";
import { GROUPS, GC, gc, shuffle, CHAIN_POS, CHAIN_COL } from "../../lib/constants.js";
import { useTouchSwap } from "../../hooks/useTouchSwap.js";

/**
 * ScrambleMode — scramblar utespelare i kedjor.
 * Sprint 2 / F1: Målvakter exkluderas automatiskt från scramblen.
 * Sprint 3 / F2: Hårda positionsregler — konfigurerbart "aldrig 1:a" per spelare.
 */
export default function ScrambleMode({ players, field, present, setPresent }) {
  // chains + done sparas i localStorage — överlever flikbyte
  const [chains, setChains] = useState(() => ls.get("hibs_chains", []) || []);
  const [size, setSize] = useState(4);
  const [done, setDone] = useState(() => !!ls.get("hibs_chains_done", false));
  const [showRules, setShowRules] = useState(false);
  // F2: Positionsregler — sparas i localStorage som Set av spelare-id som aldrig får bli 1:a
  const [neverFirst, setNeverFirst] = useState(() => new Set(ls.get("hibs_never_first", []) || []));

  const gk = players.filter(p => p.role === "malvakt");
  const gkIds = new Set(gk.map(p => p.id));

  useEffect(() => { ls.set("hibs_chains", chains); }, [chains]);
  useEffect(() => { ls.set("hibs_chains_done", done); }, [done]);
  useEffect(() => { ls.set("hibs_never_first", [...neverFirst]); }, [neverFirst]);

  const toggle = id => setPresent(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleRule = id => setNeverFirst(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // F1: Filtrera bort målvakter från scramble — bara utespelare shufflas
  const presentFieldIds = present.filter(id => !gkIds.has(id));
  const presentGkIds = present.filter(id => gkIds.has(id));
  const cnt = presentFieldIds.length;

  const doScramble = () => {
    const s = shuffle(presentFieldIds);
    const r = [];
    for (let i = 0; i < s.length; i += size) r.push(s.slice(i, i + size));
    // F2: Enforcea "aldrig 1:a"-regler — byt plats inom kedjan om spelare på pos 0 är blockerad
    for (const chain of r) {
      if (chain.length > 1 && neverFirst.has(chain[0])) {
        const swapIdx = chain.findIndex((id, i) => i > 0 && !neverFirst.has(id));
        if (swapIdx > 0) {
          [chain[0], chain[swapIdx]] = [chain[swapIdx], chain[0]];
        }
      }
    }
    setChains(r);
    setDone(true);
  };

  const rulesCount = neverFirst.size;

  // Touch drag-and-drop: swap spelare mellan positioner i kedjorna
  const touchSwap = useTouchSwap({
    onSwap: useCallback(({ ci: ci1, pi: pi1 }, { ci: ci2, pi: pi2 }) => {
      if (ci1 === ci2 && pi1 === pi2) return;
      setChains(prev => {
        const next = prev.map(c => [...c]);
        const tmp       = next[ci1]?.[pi1] ?? null;
        if (next[ci1]) next[ci1][pi1] = next[ci2]?.[pi2] ?? null;
        if (next[ci2]) next[ci2][pi2] = tmp;
        return next;
      });
    }, []),
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>{cnt} utespelare valda</div>
        <div style={{ display: "flex", gap: 6 }}>
          {/* F2: Knapp för positionsregler */}
          <button onClick={() => setShowRules(v => !v)} style={{ fontSize: 11, fontWeight: 700, color: showRules ? "#f472b6" : rulesCount > 0 ? "#f472b6" : "#4a5568", background: showRules ? "rgba(244,114,182,0.12)" : rulesCount > 0 ? "rgba(244,114,182,0.06)" : "transparent", border: "1px solid " + (showRules ? "rgba(244,114,182,0.3)" : rulesCount > 0 ? "rgba(244,114,182,0.2)" : "rgba(255,255,255,0.08)"), borderRadius: 99, padding: "6px 12px", fontFamily: "inherit", cursor: "pointer" }}>
            ⚙ Regler{rulesCount > 0 ? ` (${rulesCount})` : ""}
          </button>
          <button onClick={() => setPresent(p => p.length >= field.length + gk.length ? [] : [...field.map(x => x.id), ...gk.map(x => x.id)])} style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 99, padding: "6px 14px", fontFamily: "inherit", cursor: "pointer" }}>
            {present.length >= field.length + gk.length ? "Rensa" : "Välj alla"}
          </button>
        </div>
      </div>

      {/* F2: Positionsregler-panel */}
      {showRules && (
        <div style={{ background: "rgba(244,114,182,0.04)", border: "1px solid rgba(244,114,182,0.15)", borderRadius: 16, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#f472b6", letterSpacing: "0.08em", marginBottom: 10 }}>POSITIONSREGLER</div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>Markera spelare som aldrig ska hamna på 1:a-positionen i en kedja.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {field.map(p => {
              const blocked = neverFirst.has(p.id);
              const pgc = gc(p.group);
              return (
                <button key={p.id} onClick={() => toggleRule(p.id)} style={{ padding: "7px 14px", border: "1.5px solid " + (blocked ? "#f472b6" : "rgba(255,255,255,0.08)"), borderRadius: 99, background: blocked ? "rgba(244,114,182,0.12)" : "transparent", color: blocked ? "#f472b6" : "#4a5568", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  {blocked && <span style={{ fontSize: 10 }}>🚫</span>}
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
          {rulesCount > 0 && (
            <div style={{ fontSize: 11, color: "#f472b6", marginTop: 10, opacity: 0.8 }}>
              {[...neverFirst].map(id => players.find(x => x.id === id)?.name).filter(Boolean).join(", ")} får aldrig bli 1:a
            </div>
          )}
        </div>
      )}

      {GROUPS.map(g => {
        const gp = field.filter(p => p.group === g);
        if (!gp.length) return null;
        return (
          <div key={g} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: GC[g].color, letterSpacing: "0.1em", marginBottom: 7 }}>GRUPP {g}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {gp.map(p => { const on = (present || []).includes(p.id); const inj = p.note && p.note?.startsWith("⚠"); const blocked = neverFirst.has(p.id); return (
                <button key={p.id} onClick={() => !inj && toggle(p.id)} style={{ padding: "8px 15px", border: "1.5px solid " + (on ? GC[g].color : inj ? "rgba(255,80,80,0.3)" : "rgba(255,255,255,0.08)"), borderRadius: 99, background: on ? GC[g].bg : inj ? "rgba(255,80,80,0.05)" : "transparent", color: on ? GC[g].color : inj ? "rgba(255,80,80,0.5)" : "#4a5568", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: inj ? "not-allowed" : "pointer" }}>{p.name}{inj ? " ⚠" : ""}{blocked && on ? " 🚫" : ""}</button>
              ); })}
            </div>
          </div>
        );
      })}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: GC.MV.color, letterSpacing: "0.1em", marginBottom: 7 }}>MÅLVAKTER</div>
        <div style={{ display: "flex", gap: 7 }}>
          {gk.map(p => { const on = (present || []).includes(p.id); return (
            <button key={p.id} onClick={() => toggle(p.id)} style={{ padding: "8px 15px", border: "1.5px solid " + (on ? GC.MV.color : "rgba(255,255,255,0.08)"), borderRadius: 99, background: on ? GC.MV.bg : "transparent", color: on ? GC.MV.color : "#4a5568", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>{p.name}</button>
          ); })}
        </div>
        {/* F1: Visuell hint att målvakter inte scramblas */}
        {presentGkIds.length > 0 && (
          <div style={{ fontSize: 11, color: GC.MV.color, marginTop: 8, opacity: 0.7 }}>
            Målvakter scramblas inte — visas som "I mål" nedan
          </div>
        )}
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 14 }}>Kedjestorlek</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[3, 4, 5].map(n => <button key={n} onClick={() => setSize(n)} style={{ flex: 1, padding: "12px 0", border: "2px solid " + (size === n ? "#22c55e" : "rgba(255,255,255,0.07)"), borderRadius: 12, background: size === n ? "rgba(34,197,94,0.12)" : "transparent", color: size === n ? "#22c55e" : "#4a5568", fontSize: 16, fontWeight: 900, fontFamily: "inherit", cursor: "pointer" }}>{n}v{n}</button>)}
        </div>
        {cnt > 0 && <div style={{ fontSize: 12, color: "#4a5568", textAlign: "center", marginBottom: 14 }}>{cnt} utespelare → {Math.ceil(cnt / size)} kedjor</div>}
        <button onClick={doScramble} disabled={cnt < 2} style={{ width: "100%", padding: "15px 0", border: "none", borderRadius: 13, background: cnt >= 2 ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(255,255,255,0.05)", color: cnt >= 2 ? "#fff" : "#4a5568", fontSize: 15, fontWeight: 900, fontFamily: "inherit", cursor: cnt >= 2 ? "pointer" : "not-allowed" }}>Scrambla kedjor</button>
      </div>
      {done && chains.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Kedjorna</div>
            <button onClick={doScramble} style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 99, padding: "6px 14px", fontFamily: "inherit", cursor: "pointer" }}>Ny</button>
          </div>
          {chains.map((chain, ci) => (
            <div key={ci} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, marginBottom: 14, overflow: "hidden" }}>
              <div style={{ background: "rgba(34,197,94,0.08)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 13, fontWeight: 900, color: "#22c55e" }}>{ci + 1}</span></div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0" }}>Kedja {ci + 1}</span>
              </div>
              <div style={{ padding: "8px 0" }}>
                {chain.map((id, pi) => {
                  const p   = players.find(x => x.id === id);
                  if (!p) return null;
                  const pos = CHAIN_POS[pi] || ("Pos " + (pi + 1));
                  const pc  = CHAIN_COL[pos] || "#64748b";
                  const slotData = JSON.stringify({ ci, pi });
                  return (
                    <div
                      key={id}
                      data-swap-slot={slotData}
                      onTouchMove={touchSwap.onTouchMove}
                      onTouchEnd={touchSwap.onTouchEnd}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: pi < chain.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", userSelect: "none" }}
                    >
                      {/* ⠿ Drag-handtag — ENDA elementet som startar drag */}
                      <span
                        onTouchStart={e => touchSwap.onTouchStart(e, { ci, pi }, p.name)}
                        style={{ fontSize: 16, color: "#2e3d50", padding: "8px 6px", touchAction: "none", cursor: "grab", flexShrink: 0, lineHeight: 1, letterSpacing: "1px" }}
                      >⠿</span>
                      <span style={{ fontSize: 10, fontWeight: 900, color: pc, background: pc + "15", border: "1px solid " + pc + "30", borderRadius: 6, padding: "3px 6px", width: 38, textAlign: "center", flexShrink: 0 }}>{pos}</span>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: gc(p.group).color, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{p.name}</span>
                      <span style={{ fontSize: 10, color: "#4a5568", marginLeft: "auto" }}>Gr.{p.group}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {/* F1: Visa närvarande målvakter som "I mål" */}
          {presentGkIds.length > 0 && (
            <div style={{ background: GC.MV.bg, border: "1px solid " + GC.MV.color + "40", borderRadius: 16, padding: "14px 18px", marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: GC.MV.color, letterSpacing: "0.1em", marginBottom: 10 }}>I MÅL</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {presentGkIds.map(id => {
                  const p = players.find(x => x.id === id);
                  if (!p) return null;
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(0,0,0,0.2)", borderRadius: 99, border: "1px solid " + GC.MV.color + "30" }}>
                      <span style={{ fontSize: 16 }}>🧤</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: GC.MV.color }}>{p.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
