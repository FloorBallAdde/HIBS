/**
 * OfflineBanner — Sprint 57: gul banner när telefonen tappar nätet i hallen.
 * Alla skrivningar är optimistiska med rollback — utan denna banner ser det ut
 * som att appen "ångrar" avbockningar utan förklaring. Bannern säger varför.
 * navigator.onLine + online/offline-events. 0 requests, ren presentation.
 */
import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const [online, setOnline] = useState(
    () => (typeof navigator === "undefined" ? true : navigator.onLine !== false)
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: "rgba(251,191,36,0.12)",
        borderBottom: "1px solid rgba(251,191,36,0.3)",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 14 }} aria-hidden="true">📡</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24" }}>
          Offline — ändringar sparas inte just nu
        </div>
        <div style={{ fontSize: 12, color: "#fde68a", marginTop: 1 }}>
          Appen uppdateras automatiskt när nätet är tillbaka
        </div>
      </div>
    </div>
  );
}
