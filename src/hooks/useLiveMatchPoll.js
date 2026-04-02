import { useState, useEffect } from "react";
import { sbGet } from "../lib/supabase.js";

/**
 * Pollar Supabase var 10s för att hitta live-matcher från andra tränare i samma klubb.
 * Returnerar den andra tränarens aktiva match (eller null).
 */
export function useLiveMatchPoll({ clubId, tok, uid }) {
  const [liveMatchView, setLiveMatchView] = useState(null);

  useEffect(() => {
    if (!clubId || !tok) return;
    const poll = async () => {
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
    };
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [clubId, tok, uid]);

  return liveMatchView;
}
