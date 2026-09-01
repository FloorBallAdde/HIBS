import { useState, useEffect, useCallback } from "react";
import { sbGet } from "../lib/supabase.js";
import { usePoll } from "./usePoll.js";

/**
 * Pollar Supabase var 10s för att hitta live-matcher från andra tränare i samma klubb.
 * Returnerar den andra tränarens aktiva match (eller null).
 * Sprint 57: intervallet körs via usePoll — pausar när fliken är dold/offline.
 */
export function useLiveMatchPoll({ clubId, tok, uid }) {
  const [liveMatchView, setLiveMatchView] = useState(null);

  const poll = useCallback(async () => {
    if (!clubId || !tok) return;
    try {
      const res = await sbGet(
        "matches",
        "club_id=eq." + clubId + "&is_live=eq.true&select=id,opponent,live_state,created_by",
        tok
      );
      if (Array.isArray(res) && res.length > 0) {
        const other = res.find((m) => m.created_by !== uid);
        setLiveMatchView(other || null);
      } else {
        setLiveMatchView(null);
      }
    } catch { /* nätverksfel — behåll nuvarande state */ }
  }, [clubId, tok, uid]);

  // Direkt första hämtning (samma beteende som tidigare poll() före setInterval)
  useEffect(() => { poll(); }, [poll]);
  usePoll(poll, 10000, !!(clubId && tok));

  return liveMatchView;
}
