/**
 * usePoll — Sprint 57: gemensam polling-mekanism.
 * Konsoliderar de tre tidigare separata setInterval-looparna
 * (loadData i App.jsx 60s, useAttendance 60s, useLiveMatchPoll 10s).
 *
 * Rink-optimerad:
 * - Pausar när fliken är dold (Page Visibility API) — inga requests när
 *   telefonen är låst eller ligger i fickan → batterisnålare.
 * - Hoppar över ticks när navigator.onLine === false (offline i hallen).
 * - Kör en omedelbar refetch när fliken blir synlig igen eller nätet kommer
 *   tillbaka — färsk data direkt när Andreas tar upp telefonen.
 *
 * Callbacken hålls i en ref så att intervallet aldrig startas om när
 * callbacken byter identitet (t.ex. useCallback med nya deps).
 */
import { useEffect, useRef } from "react";

export function usePoll(callback, intervalMs, enabled = true) {
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.hidden) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      try { cbRef.current(); } catch { /* polling får aldrig krascha appen */ }
    };
    const id = setInterval(tick, intervalMs);
    const onWake = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("online", onWake);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("online", onWake);
    };
  }, [intervalMs, enabled]);
}
