import { useMemo } from "react";

// Extracts season stats computation from App.jsx
export function useSeasonStats(history) {
  const stats = useMemo(() => {
    const pm = {};
    history.forEach(m => {
      // Count match appearances from the saved players array + goalkeeper
      const lineup = [
        ...(Array.isArray(m.players) ? m.players : []),
        ...(m.goalkeeper ? [m.goalkeeper] : []),
      ];
      lineup.forEach(name => {
        if (!name) return;
        if (!pm[name]) pm[name] = { name, goals: 0, assists: 0, matches: 0 };
        pm[name].matches++;
      });
      // Goals and assists from scorers
      (m.scorers || []).forEach(s => {
        const name = typeof s === "object" ? s.name : s;
        const type = typeof s === "object" ? s.type : "goal";
        if (!pm[name]) pm[name] = { name, goals: 0, assists: 0, matches: 0 };
        if (type === "goal") pm[name].goals++;
        else pm[name].assists++;
      });
    });
    return Object.values(pm)
      .map(p => ({ ...p, points: p.goals + p.assists }))
      .sort((a, b) => b.points - a.points || b.goals - a.goals);
  }, [history]);

  const totalGoals = useMemo(() => stats.reduce((s, p) => s + p.goals, 0), [stats]);
  const totalAssists = useMemo(() => stats.reduce((s, p) => s + p.assists, 0), [stats]);
  const latestMatch = history[0] || null;

  return { stats, totalGoals, totalAssists, latestMatch };
}
