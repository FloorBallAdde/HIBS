import { useState, useEffect, useRef } from "react";
import ls from "../lib/storage.js";
import { sbGet, sbPost, sbPatch, sbDel } from "../lib/supabase.js";
import { TODAY, mkLine } from "../lib/constants.js";

// Kapslar in all match-session state, persistence och actions.
export function useMatchSession({ clubId, tok, auth, players, setPlayers, setHistory }) {
  // STATE
  const [lines, setLines] = useState(() => ls.get("hibs_lines2", [mkLine(1), mkLine(2), mkLine(3)]));
  const [reserves, setReserves] = useState(() => ls.get("hibs_reserves2", []));
  const [selected, setSelected] = useState(() => new Set(ls.get("hibs_sel2", [])));
  const [matchDate, setMatchDate] = useState(() => ls.get("hibs_mdate2", TODAY()));
  const [opponent, setOpponent] = useState(() => ls.get("hibs_opp2", ""));
  const [serie, setSerie] = useState(() => ls.get("hibs_serie2", "14A"));
  const [goalkeeper, setGoalkeeper] = useState(() => ls.get("hibs_gk2", []) || []);
  const [activeMatch, setActiveMatch] = useState(() => ls.get("hibs_active", null));
  const [matchResult, setMatchResult] = useState(() => ls.get("hibs_result", { us: "", them: "" }));
  const [matchScorers, setMatchScorers] = useState(() => ls.get("hibs_scorers", []) || []);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [matchStep, setMatchStep] = useState("select");
  const [confirmAbort, setConfirmAbort] = useState(false);
  const [teamGoals, setTeamGoals] = useState(() => ls.get("hibs_team_goals", ["", "", ""]));
  const [saveError, setSaveError] = useState(null);
  // Skott mot mål (motståndaren) — tryck en gång per skott mot vår keeper
  const [matchShots, setMatchShots] = useState(() => ls.get("hibs_match_shots", 0) || 0);
  // Skott framåt (HIBS egna skott på mål) — tryck en gång per skott vi avlossar
  const [matchShotsFor, setMatchShotsFor] = useState(() => ls.get("hibs_match_shots_for", 0) || 0);
  // Live match DB id — sparas för att uppdatera rätt rad under pågående match
  const [liveMatchId, setLiveMatchId] = useState(() => ls.get("hibs_live_match_id", null));
  const syncTimeout = useRef(null);

  // Cup-läge: sparar trupp + kedjor mellan matcher (turnering/cup-dag)
  const [cupMode, setCupMode] = useState(() => ls.get("hibs_cup_mode", false));

  // Ladda kommande matcher från Supabase när clubId och tok finns tillgängliga
  useEffect(() => {
    if (!clubId || !tok) return;
    sbGet("matches", "club_id=eq." + clubId + "&is_upcoming=eq.true&order=date.asc", tok)
      .then(r => { if (Array.isArray(r)) setUpcomingMatches(r); })
      .catch(() => {});
  }, [clubId, tok]);

  // PERSISTENCE
  useEffect(() => { ls.set("hibs_lines2", lines); }, [lines]);
  useEffect(() => { ls.set("hibs_reserves2", reserves); }, [reserves]);
  useEffect(() => { ls.set("hibs_sel2", [...selected]); }, [selected]);
  useEffect(() => { ls.set("hibs_mdate2", matchDate); }, [matchDate]);
  useEffect(() => { ls.set("hibs_opp2", opponent); }, [opponent]);
  useEffect(() => { ls.set("hibs_serie2", serie); }, [serie]);
  useEffect(() => { ls.set("hibs_gk2", goalkeeper); }, [goalkeeper]);
  useEffect(() => { ls.set("hibs_active", activeMatch); }, [activeMatch]);
  useEffect(() => { ls.set("hibs_result", matchResult); }, [matchResult]);
  useEffect(() => { ls.set("hibs_scorers", matchScorers); }, [matchScorers]);
  // upcomingMatches sparas i Supabase — ingen localStorage-persistens
  useEffect(() => { ls.set("hibs_team_goals", teamGoals); }, [teamGoals]);
  useEffect(() => { ls.set("hibs_match_shots", matchShots); }, [matchShots]);
  useEffect(() => { ls.set("hibs_match_shots_for", matchShotsFor); }, [matchShotsFor]);
  useEffect(() => { ls.set("hibs_cup_mode", cupMode); }, [cupMode]);
  useEffect(() => { ls.set("hibs_live_match_id", liveMatchId); }, [liveMatchId]);

  // Synka live state till DB (debounced 1s) när något förändras under pågående match
  useEffect(() => {
    if (!liveMatchId || !tok) return;
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => {
      const live_state = {
        result: matchResult,
        scorers: matchScorers,
        shots: matchShots,
        shots_for: matchShotsFor,
        synced_at: new Date().toISOString(),
      };
      sbPatch("matches", liveMatchId, { live_state }, tok).catch(() => {});
    }, 1000);
    return () => clearTimeout(syncTimeout.current);
  }, [matchResult, matchScorers, matchShots, matchShotsFor, liveMatchId, tok]);

  // COMPUTED
  const usedInLines = new Set(lines.flatMap(l => Object.values(l.slots).filter(Boolean)));

  // ACTIONS
  const _resetMatch = () => {
    setActiveMatch(null);
    setMatchResult({ us: "", them: "" });
    setMatchScorers([]);
    setMatchShots(0);
    setMatchShotsFor(0);
    setLiveMatchId(null);
    setOpponent(""); // Töm alltid motståndare — ny match, ny motståndare

    if (!cupMode) {
      // Normalt läge: nollställ trupp och kedjor
      setSelected(new Set());
      setGoalkeeper([]);
      setLines([mkLine(1), mkLine(2), mkLine(3)]);
      setReserves([]);
    }
    // OBS: teamGoals nollställs INTE — lagmål gäller ofta hela turneringen
  };

  const assignSlot = (li, pos, val) => {
    if (pos === "__swap__") {
      const { from, to } = val;
      setLines(ls2 => ls2.map((l, i) => {
        if (i !== li) return l;
        const s = { ...l.slots };
        [s[from], s[to]] = [s[to], s[from]];
        return { ...l, slots: s };
      }));
    } else {
      setLines(ls2 => ls2.map((l, i) => {
        if (i !== li) return l;
        const s = { ...l.slots };
        Object.keys(s).forEach(k => { if (s[k] === val) s[k] = null; });
        s[pos] = val;
        return { ...l, slots: s };
      }));
    }
  };

  const removeSlot = (li, pos) => setLines(ls2 => ls2.map((l, i) => i === li ? { ...l, slots: { ...l.slots, [pos]: null } } : l));
  const renameLine = (li, name) => setLines(ls2 => ls2.map((l, i) => i === li ? { ...l, name } : l));
  const deleteLine = li => setLines(ls2 => ls2.filter((_, i) => i !== li));

  const swapSlots = (li1, pos1, li2, pos2) => setLines(prev => {
    const next = prev.map(l => ({ ...l, slots: { ...l.slots } }));
    const p1 = next[li1]?.slots[pos1] ?? null;
    const p2 = next[li2]?.slots[pos2] ?? null;
    if (next[li1]) next[li1].slots[pos1] = p2;
    if (next[li2]) next[li2].slots[pos2] = p1;
    return next;
  });

  const toggleSelected = id => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const startMatch = async () => {
    if (!opponent.trim() || selected.size === 0) return;
    const goals = teamGoals.map(g => g.trim()).filter(Boolean);
    const m = {
      id: Date.now(),
      date: matchDate,
      opponent: opponent.trim(),
      serie,
      players: [...selected],
      goalkeeper,
      note: "",
      teamGoals: goals,
    };
    setActiveMatch(m);
    setMatchStep("live");
    // Skapa live-rad i DB om vi är anslutna
    if (clubId && tok) {
      try {
        const entry = {
          club_id: clubId,
          date: matchDate,
          opponent: opponent.trim(),
          serie,
          players: [...selected],
          goalkeeper,
          note: "",
          created_by: auth.uid,
          is_live: true,
          live_state: { result: { us: "", them: "" }, scorers: [], shots: 0, shots_for: 0, synced_at: new Date().toISOString() },
          result: { us: "", them: "" },
          scorers: [],
          shots: 0,
          shots_for: 0,
        };
        const saved = await sbPost("matches", entry, tok);
        const row = Array.isArray(saved) ? saved[0] : saved;
        if (row?.id) setLiveMatchId(row.id);
      } catch (_) {}
    }
  };

  const endMatch = async () => {
    if (!activeMatch || !clubId) return;
    setSaveError(null);
    const entry = {
      club_id: clubId,
      date: activeMatch.date,
      opponent: activeMatch.opponent,
      serie: activeMatch.serie,
      result: matchResult,
      scorers: matchScorers,
      shots: matchShots,
      shots_for: matchShotsFor,
      players: activeMatch.players,
      goalkeeper: activeMatch.goalkeeper,
      note: activeMatch.note || "",
      created_by: auth.uid,
    };
    let saved;
    try {
      if (liveMatchId) {
        // Uppdatera den befintliga live-raden med slutresultat
        const patched = await sbPatch("matches", liveMatchId, { ...entry, is_live: false, live_state: null }, tok);
        saved = Array.isArray(patched) ? patched : [{ ...entry, id: liveMatchId }];
      } else {
        saved = await sbPost("matches", entry, tok);
      }
    } catch (e) {
      setSaveError("Nätverksfel — kontrollera anslutningen och försök igen.");
      return;
    }
    if (!Array.isArray(saved) || !saved[0]) {
      setSaveError("Kunde inte spara matchen (" + (saved?.message || saved?.code || "okänt") + "). Försök igen.");
      return;
    }
    setLiveMatchId(null);
    setHistory(p => [saved[0], ...p]);

    // Ta bort kommande match från Supabase om den finns
    const matchingUpcoming = upcomingMatches.find(
      m => m.opponent === activeMatch.opponent && m.date === activeMatch.date
    );
    if (matchingUpcoming?.id && tok) {
      sbDel("matches", matchingUpcoming.id, tok).catch(() => {});
    }
    setUpcomingMatches(prev => prev.filter(
      m => !(m.opponent === activeMatch.opponent && m.date === activeMatch.date)
    ));

    const playedIds = [...activeMatch.players, ...activeMatch.goalkeeper];
    for (const pid of playedIds) {
      const pl = players.find(x => x.id === pid);
      if (pl) {
        const nm = (pl.matches || 0) + 1;
        await sbPatch("players", pid, { matches: nm, last_played: activeMatch.date }, tok);
        setPlayers(p => p.map(x => x.id === pid ? { ...x, matches: nm, last_played: activeMatch.date } : x));
      }
    }

    _resetMatch();
    // Cup-läge: hoppa direkt till kedjor (trupp sparad) — annars tillbaka till trupp
    setMatchStep(cupMode ? "lines" : "select");
  };

  const abortMatch = () => {
    _resetMatch();
    setMatchStep(cupMode ? "lines" : "select");
    setConfirmAbort(false);
  };

  // KOMMANDE MATCHER
  const addUpcoming = async (m) => {
    if (clubId && tok) {
      try {
        const row = { club_id: clubId, date: m.date, opponent: m.opponent, serie: m.serie || "14A", is_upcoming: true, created_by: auth?.uid };
        const saved = await sbPost("matches", row, tok);
        const newMatch = Array.isArray(saved) && saved[0] ? saved[0] : { ...m, id: Date.now() };
        setUpcomingMatches(prev => [...prev, newMatch].sort((a, b) => a.date.localeCompare(b.date)));
      } catch {
        setUpcomingMatches(prev => [...prev, { id: Date.now(), ...m }].sort((a, b) => a.date.localeCompare(b.date)));
      }
    } else {
      setUpcomingMatches(prev => [...prev, { id: Date.now(), ...m }].sort((a, b) => a.date.localeCompare(b.date)));
    }
  };
  const removeUpcoming = async (id) => {
    if (tok) sbDel("matches", id, tok).catch(() => {});
    setUpcomingMatches(prev => prev.filter(m => m.id !== id));
  };
  const loadFromSchedule = (scheduled) => {
    setOpponent(scheduled.opponent);
    setMatchDate(scheduled.date);
    setSerie(scheduled.serie || "14A");
    // Förfyll trupp med RSVP-anmälda spelare (om sådana finns)
    if (Array.isArray(scheduled.rsvp) && scheduled.rsvp.length > 0) {
      setSelected(new Set(scheduled.rsvp));
    }
    setMatchStep("select");
  };

  const updateUpcomingRsvp = (matchId, playerIds) => {
    // Uppdatera lokal state direkt (optimistisk)
    setUpcomingMatches(prev => prev.map(m => m.id === matchId ? { ...m, rsvp: playerIds } : m));
    // Spara i Supabase (fire-and-forget)
    if (tok) sbPatch("matches", matchId, { rsvp: playerIds }, tok).catch(() => {});
  };

  return {
    lines, setLines,
    reserves, setReserves,
    selected, setSelected,
    matchDate, setMatchDate,
    opponent, setOpponent,
    serie, setSerie,
    goalkeeper, setGoalkeeper,
    activeMatch, setActiveMatch,
    matchResult, setMatchResult,
    matchScorers, setMatchScorers,
    upcomingMatches, setUpcomingMatches,
    matchStep, setMatchStep,
    confirmAbort, setConfirmAbort,
    teamGoals, setTeamGoals,
    usedInLines,
    assignSlot, removeSlot, renameLine, deleteLine, swapSlots,
    toggleSelected,
    startMatch, endMatch, abortMatch,
    addUpcoming, removeUpcoming, loadFromSchedule, updateUpcomingRsvp,
    saveError, setSaveError,
    matchShots, setMatchShots,
    matchShotsFor, setMatchShotsFor,
    cupMode, setCupMode,
  };
}
