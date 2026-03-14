import { useState, useEffect } from "react";
import ls from "../lib/storage.js";
import { sbPost, sbPatch } from "../lib/supabase.js";
import { TODAY, mkLine } from "../lib/constants.js";

// Kapslar in all match-session state, persistence och actions.
// Minskar App.jsx med ~90 rader.
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
  const [upcomingMatches, setUpcomingMatches] = useState(() => ls.get("hibs_upcoming", []));
  const [matchStep, setMatchStep] = useState("select");
  const [confirmAbort, setConfirmAbort] = useState(false);
  const [teamGoals, setTeamGoals] = useState(() => ls.get("hibs_team_goals", ["", "", ""]));
  const [saveError, setSaveError] = useState(null);

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
  useEffect(() => { ls.set("hibs_upcoming", upcomingMatches); }, [upcomingMatches]);
  useEffect(() => { ls.set("hibs_team_goals", teamGoals); }, [teamGoals]);

  // COMPUTED
  const usedInLines = new Set(lines.flatMap(l => Object.values(l.slots).filter(Boolean)));

  // ACTIONS
  const _resetMatch = () => {
    setActiveMatch(null);
    setMatchResult({ us: "", them: "" });
    setMatchScorers([]);
    setSelected(new Set());
    setOpponent("");
    setGoalkeeper([]);
    setLines([mkLine(1), mkLine(2), mkLine(3)]);
    setReserves([]);
    setTeamGoals(["", "", ""]);
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

  const removeSlot = (li, pos) =>
    setLines(ls2 => ls2.map((l, i) => i === li ? { ...l, slots: { ...l.slots, [pos]: null } } : l));

  const renameLine = (li, name) =>
    setLines(ls2 => ls2.map((l, i) => i === li ? { ...l, name } : l));

  const deleteLine = li =>
    setLines(ls2 => ls2.filter((_, i) => i !== li));

  // Swap två slots — fungerar inom samma linje och över linjer
  const swapSlots = (li1, pos1, li2, pos2) =>
    setLines(prev => {
      const next = prev.map(l => ({ ...l, slots: { ...l.slots } }));
      const p1 = next[li1]?.slots[pos1] ?? null;
      const p2 = next[li2]?.slots[pos2] ?? null;
      if (next[li1]) next[li1].slots[pos1] = p2;
      if (next[li2]) next[li2].slots[pos2] = p1;
      return next;
    });

  const toggleSelected = id =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const startMatch = () => {
    if (!opponent.trim() || selected.size === 0) return;
    const goals = teamGoals.map(g => g.trim()).filter(Boolean);
    const m = { id: Date.now(), date: matchDate, opponent: opponent.trim(), serie, players: [...selected], goalkeeper, note: "", teamGoals: goals };
    setActiveMatch(m);
    setMatchStep("live");
  };

  const endMatch = async () => {
    if (!activeMatch || !clubId) return;
    setSaveError(null);
    const entry = {
      club_id: clubId, date: activeMatch.date, opponent: activeMatch.opponent,
      serie: activeMatch.serie, result: matchResult, scorers: matchScorers,
      players: activeMatch.players, goalkeeper: activeMatch.goalkeeper,
      note: activeMatch.note || "", created_by: auth.uid,
    };
    let saved;
    try {
      saved = await sbPost("matches", entry, tok);
    } catch (e) {
      setSaveError("Nätverksfel — kontrollera anslutningen och försök igen.");
      return;
    }
    if (!Array.isArray(saved) || !saved[0]) {
      setSaveError("Kunde inte spara matchen (fel: " + (saved?.message || saved?.code || "okänt") + "). Försök igen.");
      return;
    }
    setHistory(p => [saved[0], ...p]);
    // Ta bort matchande kommande match från schemat (same opponent + date)
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
    setMatchStep("select");
  };

  const abortMatch = () => {
    _resetMatch();
    setMatchStep("select");
    setConfirmAbort(false);
  };

  // KOMMANDE MATCHER — lägg till, ta bort, ladda in till match-trupp
  const addUpcoming = (m) =>
    setUpcomingMatches(prev => [...prev, { id: Date.now(), ...m }].sort((a, b) => a.date.localeCompare(b.date)));

  const removeUpcoming = (id) =>
    setUpcomingMatches(prev => prev.filter(m => m.id !== id));

  const loadFromSchedule = (scheduled) => {
    setOpponent(scheduled.opponent);
    setMatchDate(scheduled.date);
    setSerie(scheduled.serie || "14A");
    setMatchStep("select");
  };

  return {
    lines, setLines, reserves, setReserves,
    selected, setSelected, matchDate, setMatchDate,
    opponent, setOpponent, serie, setSerie,
    goalkeeper, setGoalkeeper, activeMatch, setActiveMatch,
    matchResult, setMatchResult, matchScorers, setMatchScorers,
    upcomingMatches, setUpcomingMatches,
    matchStep, setMatchStep,
    confirmAbort, setConfirmAbort,
    teamGoals, setTeamGoals,
    usedInLines,
    assignSlot, removeSlot, renameLine, deleteLine, swapSlots,
    toggleSelected, startMatch, endMatch, abortMatch,
    addUpcoming, removeUpcoming, loadFromSchedule,
    saveError, setSaveError,
  };
}
