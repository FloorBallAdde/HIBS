import { useState } from "react";
import { GROUPS, GC, gc } from "../../lib/constants.js";
import ScrambleMode from "./ScrambleMode.jsx";
import GrupperMode from "./GrupperMode.jsx";
import BlandaMode from "./BlandaMode.jsx";

export default function KedjorTab({ players, onUpdatePlayerGroup }) {
  const [mode, setMode] = useState("scramble");
  const field = players.filter(p => p.role !== "malvakt");
  const MODES = [["scramble", "Scrambla"], ["grupper", "Grupper"], ["blanda", "Blanda"]];
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {MODES.map(([id, label]) => (
          <button key={id} onClick={() => setMode(id)} style={{ flex: 1, padding: "8px 0", border: "1px solid " + (mode === id ? "#a78bfa" : "rgba(255,255,255,0.07)"), borderRadius: 10, background: mode === id ? "rgba(167,139,250,0.1)" : "transparent", color: mode === id ? "#a78bfa" : "#4a5568", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>{label}</button>
        ))}
      </div>
      {mode === "scramble" && <ScrambleMode players={players} field={field} />}
      {mode === "grupper" && <GrupperMode field={field} onUpdateGroup={onUpdatePlayerGroup} />}
      {mode === "blanda" && <BlandaMode field={field} />}
    </div>
  );
}
