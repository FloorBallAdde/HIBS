/**
 * useAttendance — Sprint 56: migrerad från localStorage till Supabase.
 * Tabell: training_attendance — EN rad per (session, spelare).
 * Cross-device sync: alla tränare i klubben ser samma närvaro, och två tränare
 * kan bocka av olika spelare samtidigt utan att skriva över varandra.
 *
 * Konsument-API:t är oförändrat (PlaneraTab/StatsContent behöver inte ändras):
 *   attendance = { [sessionId]: [playerName, ...] }
 *
 * Engångsmigrering: befintlig localStorage-data ("hibs_att") pushas till Supabase
 * första gången hooken laddar mot en tom tabell. Flagga "hibs_att_migrated"
 * förhindrar dubbelmigrering. Endast sessioner med uuid-id migreras (lokala
 * fallback-id:n av typen Date.now() pekar inte på riktiga training_sessions).
 *
 * Polling var 60s via usePoll (Sprint 57) — pausar när fliken är dold/offline.
 * ⚠️ Supabase-schema: kräver ny tabell — se docs/RESEARCH.md (Sprint 56) för SQL.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ls from "../lib/storage.js";
import { sbGet, sbPost, sbDel } from "../lib/supabase.js";
import { usePoll } from "./usePoll.js";

const LEGACY_KEY = "hibs_att";
const MIGRATED_KEY = "hibs_att_migrated";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useAttendance({ clubId, tok, uid } = {}) {
  const [rows, setRows] = useState([]); // [{ id, session_id, player_name, ... }]
  const migrationDone = useRef(false);

  const load = useCallback(async () => {
    if (!clubId || !tok) return [];
    try {
      const data = await sbGet("training_attendance", "club_id=eq." + clubId + "&order=created_at.asc", tok);
      if (Array.isArray(data)) { setRows(data); return data; }
    } catch { /* nätverksfel — behåll nuvarande state */ }
    return [];
  }, [clubId, tok]);

  // Initial load + engångsmigrering av legacy localStorage-data
  useEffect(() => {
    if (!clubId || !tok) return;
    (async () => {
      const serverRows = await load();
      if (migrationDone.current || ls.get(MIGRATED_KEY, false)) return;
      migrationDone.current = true;
      const legacy = ls.get(LEGACY_KEY, {});
      const entries = Object.entries(legacy).filter(
        ([sid, names]) => UUID_RE.test(sid) && Array.isArray(names) && names.length > 0
      );
      // Migrera bara mot tom tabell — finns serverdata har någon redan migrerat
      if (serverRows.length === 0 && entries.length > 0) {
        for (const [sessionId, names] of entries) {
          try {
            await sbPost(
              "training_attendance",
              names.map(n => ({ club_id: clubId, session_id: sessionId, player_name: n, created_by: uid })),
              tok
            );
          } catch { /* enskild session kan ha raderats — hoppa över */ }
        }
        await load();
      }
      ls.set(MIGRATED_KEY, true);
    })();
  }, [clubId, tok, uid, load]);

  // Polling: hämta närvaro var 60s så co-tränares avbockningar syns
  // (Sprint 57: via usePoll — pausar när fliken är dold/offline)
  usePoll(load, 60 * 1000, !!(clubId && tok));

  // Konsument-form: { [sessionId]: [playerName, ...] }
  const attendance = useMemo(() => {
    const map = {};
    rows.forEach(r => { (map[r.session_id] = map[r.session_id] || []).push(r.player_name); });
    return map;
  }, [rows]);

  /** Toggle en spelare för en session. Optimistisk UI + Supabase-skrivning. */
  const togglePlayer = useCallback(async (sessionId, playerName) => {
    const existing = rows.find(r => r.session_id === sessionId && r.player_name === playerName);
    if (existing) {
      setRows(prev => prev.filter(r => r.id !== existing.id));
      try { await sbDel("training_attendance", existing.id, tok); }
      catch { setRows(prev => [...prev, existing]); } // rollback vid nätverksfel
    } else {
      const tempId = "tmp_" + Date.now();
      setRows(prev => [...prev, { id: tempId, club_id: clubId, session_id: sessionId, player_name: playerName }]);
      try {
        const saved = await sbPost(
          "training_attendance",
          { club_id: clubId, session_id: sessionId, player_name: playerName, created_by: uid },
          tok
        );
        const row = Array.isArray(saved) && saved[0] ? saved[0] : null;
        if (row) setRows(prev => prev.map(r => (r.id === tempId ? row : r)));
        else setRows(prev => prev.filter(r => r.id !== tempId)); // serverfel (t.ex. RLS) → rollback
      } catch {
        setRows(prev => prev.filter(r => r.id !== tempId)); // rollback vid nätverksfel
      }
    }
  }, [rows, clubId, tok, uid]);

  /** Return attendee list for one session (array of player names). */
  const getSessionAttendance = useCallback(
    (sessionId) => attendance[sessionId] || [],
    [attendance]
  );

  return { attendance, togglePlayer, getSessionAttendance };
}
