import { useState, useEffect } from "react";
import ls from "../../lib/storage.js";
import { GROUPS, GC, gc } from "../../lib/constants.js";
import ScrambleMode from "./ScrambleMode.jsx";
import GrupperMode from "./GrupperMode.jsx";
import BlandaMode from "./BlandaMode.jsx";

export default function KedjorTab({ players, onUpdatePlayerGroup }) {
  const [mode, setMode] = useState("scramble");
  // Lyft present-state hit så att Grupper + Blanda vet vilka som är på träning
  const [present, setPresent] = useState(() => ls.get("hibs_present", []) || []);
  useEffect(() => { ls.set("hibs_present", present); }, [present]);

  const field = players.filter(p => p.role !== "malvakt");
  // Om minst en spelare är markerad som närvarande — filtrera. Annars visa alla.
  const presentField = present.length > 0 ? field.filter(p => present.includes(p.id)) : field;

  const MODES = [["scramble", "Scrambla"], ["grupper", "Grupper"], ["blanda", "Blanda"]];
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {MODES.map(([id, label]) => (
          <button key={id} onClick={() => setMode(id)} style={{ flex: 1, padding: "8px 0", border: "1px solid " + (mode === id ? "#a78bfa" : "rgba(255,255,255,0.07)"), borderRadius: 10, background: mode === id ? "rgba(167,139,250,0.1)" : "transparent", color: mode === id ? "#a78bfa" : "#4a5568", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>{label}</button>
        ))}
      </div>
      {mode === "scramble" && <ScrambleMode players={players} field={field} present={present} setPresent={setPresent} />}
      {mode === "grupper" && <GrupperMode field={presentField} onUpdateGroup={onUpdatePlayerGroup} />}
      {mode === "blanda" && <BlandaMode field={presentField} />}
    </div>
  );
}
