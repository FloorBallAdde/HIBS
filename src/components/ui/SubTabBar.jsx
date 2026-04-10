/**
 * SubTabBar — Återanvändbar radknapp-meny för sub-flikar.
 * Extraherad från App.jsx (Sprint 31 refaktorering).
 *
 * Props:
 *   tabs    — [[id, label], …]
 *   current — aktiv tab-id (sträng)
 *   onChange — fn(id) kallas vid knapptryck
 */
export default function SubTabBar({ tabs, current, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
      {tabs.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          style={{
            flex: 1,
            padding: "9px 0",
            border: "1px solid " + (current === id ? "#22c55e" : "rgba(255,255,255,0.07)"),
            borderRadius: 10,
            background: current === id ? "rgba(34,197,94,0.1)" : "transparent",
            color: current === id ? "#22c55e" : "#4a5568",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
