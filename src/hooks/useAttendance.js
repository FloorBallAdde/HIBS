/**
 * useAttendance — Sprint 23 (P12 Närvaro & statistik).
 * Tracks which players attended each training session.
 * Storage: localStorage key "hibs_att" = { [sessionId]: [playerName, ...] }
 * No Supabase schema changes needed — localStorage-only MVP.
 */
import { useState, useCallback } from "react";
import ls from "../lib/storage.js";

const KEY = "hibs_att";

export function useAttendance() {
  const [attendance, setAttendance] = useState(() => ls.get(KEY, {}));

  /** Toggle a player in/out for a given session. Auto-persists to localStorage. */
  const togglePlayer = useCallback((sessionId, playerName) => {
    setAttendance(prev => {
      const curr = prev[sessionId] || [];
      const next = curr.includes(playerName)
        ? curr.filter(n => n !== playerName)
        : [...curr, playerName];
      const updated = { ...prev, [sessionId]: next };
      ls.set(KEY, updated);
      return updated;
    });
  }, []);

  /** Return attendee list for one session (array of player names). */
  const getSessionAttendance = useCallback(
    (sessionId) => attendance[sessionId] || [],
    [attendance]
  );

  return { attendance, togglePlayer, getSessionAttendance };
}
