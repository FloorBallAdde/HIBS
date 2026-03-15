import { useMemo } from "react";

/**
 * useSeasonStats(history, players)
 *
 * history  — array av match-objekt från DB
 * players  — array av spelar-objekt (behövs för att lösa ID → namn)
 *
 * Returnerar:
 *   stats       — utespelares poänglista (goals/assists/matches/points)
 *   keeperStats — målvaktsstatistik (matches/shots/saves/cleanSheets/W/D/L)
 *   totalGoals, totalAssists, latestMatch
 */
export function useSeasonStats(history, players = []) {

  // ── UTESPELARE-STATISTIK ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const pm = {};

    history.forEach(m => {
      // Lös spelar-ID:n → namn för att räkna matcher korrekt
      const fieldIds  = Array.isArray(m.players)    ? m.players    : [];
      const keeperIds = Array.isArray(m.goalkeeper) ? m.goalkeeper : [];

      [...fieldIds, ...keeperIds].forEach(id => {
        const pl = players.find(x => x.id === id);
        if (!pl) return;
        if (!pm[pl.name]) pm[pl.name] = { name: pl.name, goals: 0, assists: 0, matches: 0 };
        pm[pl.name].matches++;
      });

      // Mål och assist från scorers (redan namn-baserat)
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
  }, [history, players]);

  // ── MÅLVAKTSSTATISTIK ───────────────────────────────────────────────────
  const keeperStats = useMemo(() => {
    const km = {};

    history.forEach(m => {
      const keeperIds   = Array.isArray(m.goalkeeper) ? m.goalkeeper : [];
      const goalsAgainst = parseInt(m.result?.them) || 0;
      const shotsTotal   = parseInt(m.shots) || 0; // totala skott mot mål (sparas i matchen)

      const usInt   = parseInt(m.result?.us);
      const themInt = parseInt(m.result?.them);
      const hasResult = m.result?.us !== "" && m.result?.them !== ""
        && !isNaN(usInt) && !isNaN(themInt);

      keeperIds.forEach(id => {
        const pl = players.find(x => x.id === id);
        if (!pl) return;
        if (!km[pl.name]) km[pl.name] = {
          name: pl.name,
          matches: 0,
          goalsAgainst: 0,
          shots: 0,
          cleanSheets: 0,
          wins: 0, draws: 0, losses: 0,
        };
        const k = km[pl.name];
        k.matches++;
        k.goalsAgainst += goalsAgainst;
        k.shots        += shotsTotal;
        if (hasResult && goalsAgainst === 0) k.cleanSheets++;
        if (hasResult) {
          if (usInt > themInt) k.wins++;
          else if (usInt < themInt) k.losses++;
          else k.draws++;
        }
      });
    });

    // Beräkna saves + räddningsprocent
    return Object.values(km)
      .map(k => ({
        ...k,
        saves: Math.max(0, k.shots - k.goalsAgainst),
        savePct: k.shots > 0
          ? Math.round(Math.max(0, k.shots - k.goalsAgainst) / k.shots * 100)
          : null,
        gaa: k.matches > 0
          ? Math.round(k.goalsAgainst / k.matches * 10) / 10
          : null,
      }))
      .sort((a, b) => b.matches - a.matches);
  }, [history, players]);

  const totalGoals   = useMemo(() => stats.reduce((s, p) => s + p.goals,   0), [stats]);
  const totalAssists = useMemo(() => stats.reduce((s, p) => s + p.assists, 0), [stats]);
  const latestMatch  = history[0] || null;

  return { stats, keeperStats, totalGoals, totalAssists, latestMatch };
}
