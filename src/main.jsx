import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// iOS Safari aktiverar inte :active på knappar utan detta trick
document.addEventListener('touchstart', function(){}, { passive: true });

/**
 * ErrorBoundary (Sprint 82) — en krasch ska ALDRIG mer bli en svart skärm.
 * Visar felet + en Ladda om-knapp så Andreas kan komma vidare vid rinken
 * och rapportera exakt vad som stod.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", background: "#0b0d14", color: "#fff", fontFamily: "system-ui,sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏑💥</div>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Något gick snett</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Skicka gärna texten nedan till Adde:</div>
          <div style={{ fontSize: 11, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, maxWidth: 340, wordBreak: "break-word" }}>
            {String(this.state.error?.message || this.state.error)}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "14px 32px", minHeight: 44, border: "none", borderRadius: 12, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 15, fontWeight: 900, fontFamily: "inherit", cursor: "pointer" }}
          >
            Ladda om appen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
