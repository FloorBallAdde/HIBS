import { useState } from "react";
import { useApp } from "../../lib/AppContext.jsx";
import { KEDJE_GROUPS, LINE_FORMATS, PCOLOR, PLABEL, GC, groupShort } from "../../lib/constants.js";

/**
 * GrundkedjorView — Mer → Grundkedjor (Sprint 83, omgjord för två-tryck-byten).
 * Alla linor i ett rutnät (rad = lina, kolumn = position). Tryck på en spelare,
 * tryck sedan på en annan plats → de byter plats (tom plats = flytt).
 * "Utan plats" längst ner: tryck spelare → tryck plats = placera (den som stod där åker ut).
 * Sparas på spelaren (players.group = lina, players.position = plats).
 * Matchens kedjor laddas härifrån men ändringar i match slår aldrig tillbaka.
 */
export default function GrundkedjorView() {
  const { players, updP } = useApp();
  const [sel, setSel] = useState(null); // { g, pos } | { id } | null

  const POS = LINE_FORMATS[5];
  const field = players.filter(p => p.role !== "malvakt");
  const at = (g, pos) => field.find(p => p.group === g && p.position === pos) || null;
  const unplaced = field.filter(p => !p.position || !POS.includes(p.position)).sort((a, b) => a.name.localeCompare(b.name, "sv"));

  const selPlayer = sel ? (sel.id ? field.find(p => p.id === sel.id) : at(sel.g, sel.pos)) : null;
  const isSel = (g, pos) => sel && !sel.id && sel.g === g && sel.pos === pos;

  const tapSlot = async (g, pos) => {
    const here = at(g, pos);
    if (!sel) { setSel({ g, pos }); return; }
    if (isSel(g, pos)) { setSel(null); return; }
    setSel(null);
    if (sel.id) {
      // Spelare utan plats → in på platsen; den som stod där åker ut
      if (here) await updP(here.id, { position: null });
      await updP(sel.id, { group: g, position: pos });
      return;
    }
    // Plats ↔ plats: byt (tom plats = flytt)
    const from = at(sel.g, sel.pos);
    if (from) await updP(from.id, { group: g, position: pos });
    if (here) await updP(here.id, { group: sel.g, position: sel.pos });
  };

  const tapUnplaced = async (p) => {
    if (sel && !sel.id) {
      // Vald plats + spelare utan plats → placera
      const { g, pos } = sel;
      setSel(null);
      const here = at(g, pos);
      if (here) await updP(here.id, { position: null });
      await updP(p.id, { group: g, position: pos });
      return;
    }
    setSel(sel?.id === p.id ? null : { id: p.id });
  };

  const takeOut = async () => {
    const p = selPlayer;
    setSel(null);
    if (p && !sel.id) await updP(p.id, { position: null });
  };

  const hint = !sel
    ? "Tryck på en spelare och sedan på en annan plats — de byter plats."
    : selPlayer
      ? (sel.id ? "Tryck på platsen där " + selPlayer.name + " ska stå." : "Tryck på en annan plats för att byta med " + selPlayer.name + ".")
      : "Tryck på en spelare för att flytta hit, eller välj någon utan plats.";

  return (
    <div style={{ paddingBottom: sel ? 90 : 0 }}>
      {/* Positionsrubriker */}
      <div style={{ display: "grid", gridTemplateColumns: "34px repeat(5, 1fr)", gap: 4, marginBottom: 4 }}>
        <span />
        {POS.map(pos => (
          <span key={pos} style={{ textAlign: "center", fontSize: 11, fontWeight: 900, color: PCOLOR[pos] }}>{PLABEL[pos]}</span>
        ))}
      </div>

      {/* En rad per lina */}
      {KEDJE_GROUPS.map(g => {
        const col = GC[g].color;
        return (
          <div key={g} style={{ display: "grid", gridTemplateColumns: "34px repeat(5, 1fr)", gap: 4, marginBottom: 4, alignItems: "stretch" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: col }}>{groupShort(g)}</span>
            {POS.map(pos => {
              const p = at(g, pos);
              const on = isSel(g, pos);
              const target = sel && !on;
              return (
                <button
                  key={pos}
                  onClick={() => tapSlot(g, pos)}
                  style={{
                    minHeight: 48, padding: "4px 2px", borderRadius: 10,
                    border: on ? "2px solid #fff" : "1px solid " + (p ? col + "55" : target ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"),
                    borderStyle: p || on ? "solid" : "dashed",
                    background: on ? col + "40" : p ? col + "14" : "transparent",
                    color: p ? "#fff" : "#4a5568",
                    fontSize: 11.5, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2,
                  }}
                >
                  {p ? p.name : "+"}
                </button>
              );
            })}
          </div>
        );
      })}

      {/* Utan plats */}
      <div style={{ marginTop: 14, padding: "12px 12px", borderRadius: 14, border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", marginBottom: 8 }}>UTAN PLATS</div>
        {unplaced.length === 0
          ? <div style={{ fontSize: 12, color: "#4a5568" }}>Alla spelare har en plats.</div>
          : <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {unplaced.map(p => {
                const on = sel?.id === p.id;
                return (
                  <button key={p.id} onClick={() => tapUnplaced(p)} style={{ minHeight: 44, padding: "6px 14px", borderRadius: 99, border: on ? "2px solid #fff" : "1px solid rgba(255,255,255,0.12)", background: on ? "rgba(255,255,255,0.12)" : "transparent", color: "#cbd5e1", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                    {p.name}
                  </button>
                );
              })}
            </div>}
      </div>

      <div style={{ fontSize: 12, color: "#64748b", marginTop: 12, lineHeight: 1.5 }}>{hint} Allt sparas direkt.</div>

      {/* Åtgärdsrad när något är valt */}
      {sel && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 86, padding: "10px 16px", background: "rgba(11,13,20,0.96)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 8, zIndex: 150 }}>
          {selPlayer && !sel.id && (
            <button onClick={takeOut} style={{ flex: 1, minHeight: 44, borderRadius: 12, border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>
              Ta ut {selPlayer.name}
            </button>
          )}
          <button onClick={() => setSel(null)} style={{ flex: 1, minHeight: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>
            Avbryt
          </button>
        </div>
      )}
    </div>
  );
}
