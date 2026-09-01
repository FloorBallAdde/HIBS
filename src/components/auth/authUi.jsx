// Delade UI-byggstenar för auth-flödet (AuthScreen + ClubSetup)

export const inpStyle = { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#fff", fontSize: 14, padding: "12px 14px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 };

export function AuthButton({ label, onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 14, background: loading ? "rgba(255,255,255,0.06)" : "#a78bfa", color: loading ? "#4a5568" : "#fff", fontSize: 15, fontWeight: 900, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", marginBottom: 10 }}>
      {loading ? "Väntar..." : label}
    </button>
  );
}
