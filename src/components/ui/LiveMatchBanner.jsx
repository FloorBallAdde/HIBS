/**
 * LiveMatchBanner — visar röd pulsande banner när en annan tränare kör live-match.
 * Klick navigerar till match-fliken.
 */
export default function LiveMatchBanner({ liveMatchView, onNavigate }) {
  if (!liveMatchView) return null;

  return (
    <div
      onClick={onNavigate}
      style={{
        background: "rgba(239,68,68,0.12)",
        borderBottom: "1px solid rgba(239,68,68,0.3)",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#ef4444",
          animation: "pulse 1s infinite",
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
          🔴 LIVE — HIBS vs {liveMatchView.opponent}
        </div>
        {liveMatchView.live_state && (
          <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 1 }}>
            {liveMatchView.live_state.result?.us || 0} –{" "}
            {liveMatchView.live_state.result?.them || 0}
            {" · "}Skott: {liveMatchView.live_state.shots_for || 0}–
            {liveMatchView.live_state.shots || 0}
          </div>
        )}
      </div>
      <span style={{ fontSize: 11, color: "#f87171" }}>Se matchen ›</span>
    </div>
  );
}
