import { useState } from "react";
import Sheet from "../ui/Sheet.jsx";

export default function NoteModal({ player, onSave, onClose }) {
  const [text, setText] = useState(player.note || "");
  return (
    <Sheet onClose={onClose} overlayOpacity={0.75}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Anteckning - {player.name}</div>
      <div style={{ fontSize: 11, color: "#4a5568", marginBottom: 14 }}>Börja med ⚠ för att markera skada</div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="T.ex. ⚠ skadad knä" style={{ width: "100%", minHeight: 80, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 14, padding: 12, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box" }} />
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "12px 0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "transparent", color: "#4a5568", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Avbryt</button>
        <button onClick={() => onSave(text)} style={{ flex: 1, padding: "12px 0", border: "none", borderRadius: 12, background: "#a78bfa", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Spara</button>
      </div>
    </Sheet>
  );
}
