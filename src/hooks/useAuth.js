import { useState, useEffect, useCallback } from "react";
import ls from "../lib/storage.js";
import { sbAuth, sbGet, sbRefresh, sbPatch } from "../lib/supabase.js";

/**
 * useAuth — hanterar autentisering, JWT-refresh, profilhämtning och tränarpersonal.
 * Extraherad från App.jsx i Sprint 26 för att minska rotkomponentens ansvar.
 */
export function useAuth() {
  // Auth state
  const [auth, setAuth] = useState(() => {
    const tok = ls.get("hibs_token", null);
    const uid = ls.get("hibs_uid", null);
    if (!tok || !uid) return null;
    return { tok, uid };
  });
  const [profile, setProfile] = useState(null);
  const [pendingCoaches, setPendingCoaches] = useState([]);
  const [coachStaff, setCoachStaff] = useState([]);

  // AUTO-REFRESH: förnya JWT var 50:e minut så den aldrig hinner gå ut under en matchdag
  useEffect(() => {
    const refresh = async () => {
      const rt = ls.get("hibs_refresh", null);
      if (!rt) return;
      const res = await sbRefresh(rt);
      if (res?.access_token) {
        ls.set("hibs_token", res.access_token);
        if (res.refresh_token) ls.set("hibs_refresh", res.refresh_token);
        setAuth(a => a ? { ...a, tok: res.access_token } : a);
      }
    };
    refresh(); // kör direkt vid start för att fräscha upp en ev. gammal token
    const id = setInterval(refresh, 50 * 60 * 1000); // var 50 min
    return () => clearInterval(id);
  }, []);

  // Load profile on startup — hämtar klubb separat (ingen FK-join nödvändig)
  useEffect(() => {
    if (auth?.tok && !profile) {
      sbGet("profiles", "id=eq." + auth.uid + "&select=*", auth.tok).then(async res => {
        if (Array.isArray(res) && res[0]) {
          const p = res[0];
          if (p.club_id) {
            try {
              const club = await sbGet("clubs", "id=eq." + p.club_id, auth.tok);
              if (Array.isArray(club) && club[0]) p.clubs = club[0];
            } catch (_) {}
          }
          setProfile(p);
        } else {
          ["hibs_token", "hibs_uid", "hibs_refresh"].forEach(k => ls.remove(k));
          setAuth(null);
        }
      }).catch(() => {
        // Nätverksfel vid profilhämtning — rensa auth så användaren kan logga in på nytt
        ["hibs_token", "hibs_uid", "hibs_refresh"].forEach(k => ls.remove(k));
        setAuth(null);
      });
    }
  }, [auth]);

  // Load pending coaches + coach staff if owner/admin
  useEffect(() => {
    if ((profile?.role === "owner" || profile?.role === "admin") && profile?.club_id && auth?.tok) {
      sbGet("profiles", "club_id=eq." + profile.club_id + "&approved=eq.false&role=eq.coach&select=*", auth.tok)
        .then(r => { if (Array.isArray(r)) setPendingCoaches(r); });
      sbGet("profiles", "club_id=eq." + profile.club_id + "&approved=eq.true&id=neq." + auth.uid + "&select=id,username,role", auth.tok)
        .then(r => { if (Array.isArray(r)) setCoachStaff(r); });
    }
  }, [profile]);

  const handleAuth = useCallback(({ tok, uid, profile: p }) => {
    ls.set("hibs_token", tok);
    ls.set("hibs_uid", uid);
    setAuth({ tok, uid });
    setProfile(p);
  }, []);

  const handleSignOut = useCallback(async () => {
    if (auth?.tok) await sbAuth("logout", {}).catch(() => {});
    // Clear only auth & session keys — preserve checklist/roadmap local state
    ["hibs_token", "hibs_uid", "hibs_refresh",
     "hibs_active", "hibs_result", "hibs_scorers", "hibs_lines2",
     "hibs_reserves2", "hibs_sel2", "hibs_mdate2", "hibs_opp2",
     "hibs_serie2", "hibs_gk2", "hibs_team_goals", "hibs_match_shots",
     "hibs_match_shots_for", "hibs_live_match_id", "hibs_cup_mode",
     "hibs_subs", "hibs_upcoming"].forEach(k => ls.remove(k));
    setAuth(null);
    setProfile(null);
  }, [auth?.tok]);

  const updateClub = useCallback(async (patch) => {
    if (!profile?.club_id || !auth?.tok) return;
    await sbPatch("clubs", profile.club_id, patch, auth.tok);
    setProfile(p => p ? { ...p, clubs: { ...p.clubs, ...patch } } : p);
  }, [profile?.club_id, auth?.tok]);

  return {
    auth,
    profile,
    pendingCoaches,
    setPendingCoaches,
    coachStaff,
    setCoachStaff,
    handleAuth,
    handleSignOut,
    updateClub,
  };
}
