import { useState, useEffect, useCallback } from "react";
import { sbGet } from "../../lib/supabase.js";
import { CATEGORIES, INTENSITIES, CAT_COLOR } from "../../lib/constants.js";
import ls from "../../lib/storage.js";

const FAV_KEY = "hibs_fav_ex";
const ALL_CATS = ["★ Favoriter", ...CATEGORIES];

export default function OvningarTab({ token }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("Alla");
  const [intensity, setIntensity] = useState("Alla");
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState(null);
  const [favorites, setFavorites] = useState(() => new Set(ls.get(FAV_KEY, [])));

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await sbGet("exercises", "order=name.asc", token);
      if (Array.isArray(res)) setExercises(res);
      setLoading(false);
    })();
  }, []);

  const toggleFav = useCallback((e, id) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      ls.set(FAV_KEY, [...next]);
      return next;
    });
  }, []);

  const filtered = exercises.filter(e => {
    if (cat === "★ Favoriter" && !favorites.has(e.id)) return false;
    if (cat !== "Alla" && cat !== "★ Favoriter" && e.category !== cat) return false;
    if (intensity !== "Alla" && e.intensity !== intensity) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök övning..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, color: "#fff", fontSize: 13, padding: "10px 14px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Category chips — includes ★ Favoriter */}
      <div style={{ overflowX: "auto", marginBottom: 8, paddingBottom: 2 }}>
        <div style={{ display: "flex", gap: 6, width: "max-content" }}>
          {ALL_CATS.map(c => {
            const isFavBtn = c === "★ Favoriter";
            const active = cat === c;
            const activeColor = isFavBtn ? "#fbbf24" : "#22c55e";
            return (
              <button key={c} onClick={() => setCat(c)} style={{
                padding: "5px 11px",
                border: "1px solid " + (active ? activeColor : "rgba(255,255,255,0.07)"),
                borderRadius: 99,
                background: active ? activeColor + "20" : "transparent",
                color: active ? activeColor : isFavBtn ? "#fbbf24" : "#4a5568",
                fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap",
              }}>{c}{isFavBtn && favorites.size > 0 ? ` (${favorites.size})` : ""}</button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {INTENSITIES.map(i => <button key={i} onClick={() => setIntensity(i)} style={{ flex: 1, padding: "5px 0", border: "1px solid " + (intensity === i ? "#22c55e" : "rgba(255,255,255,0.07)"), borderRadius: 99, background: intensity === i ? "rgba(34,197,94,0.12)" : "transparent", color: intensity === i ? "#22c55e" : "#4a5568", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>{i}</button>)}
      </div>

      {loading && <div style={{ textAlign: "center", color: "#4a5568", fontSize: 13, padding: 16 }}>Laddar...</div>}
      <div style={{ fontSize: 11, color: "#4a5568", marginBottom: 8 }}>{filtered.length} övningar</div>

      {cat === "★ Favoriter" && favorites.size === 0 && (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "#4a5568", fontSize: 13 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>☆</div>
          Tryck på stjärnan på en övning för att spara den som favorit
        </div>
      )}

      {filtered.map(ex => {
        const cc = CAT_COLOR[ex.category] || "#64748b";
        const isFav = favorites.has(ex.id);
        return (
          <div key={ex.id} onClick={() => setSel(ex)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 8, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: cc, background: cc + "15", border: "1px solid " + cc + "25", borderRadius: 99, padding: "2px 8px" }}>{ex.category}</span>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginTop: 5 }}>{ex.name}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>{ex.vad}</div>
              </div>
              <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                {ex.players && <div style={{ fontSize: 11, color: "#4a5568" }}>{ex.players} sp</div>}
                <div style={{ fontSize: 11, color: ex.intensity === "Hög" ? "#f87171" : ex.intensity === "Medel" ? "#fbbf24" : "#34d399" }}>{ex.intensity}</div>
                {/* Favorite star button */}
                <button
                  onClick={e => toggleFav(e, ex.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 0", minHeight: 28, minWidth: 28, display: "flex", alignItems: "center", justifyContent: "center" }}
                  aria-label={isFav ? "Ta bort favorit" : "Lägg till favorit"}
                >
                  {isFav ? "★" : "☆"}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {sel && (
        <div onClick={() => setSel(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", width: "100%", maxWidth: 430, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, color: CAT_COLOR[sel.category] || "#64748b", background: (CAT_COLOR[sel.category] || "#64748b") + "18", border: "1px solid " + (CAT_COLOR[sel.category] || "#64748b") + "30", borderRadius: 99, padding: "3px 10px" }}>{sel.category}</span>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginTop: 8 }}>{sel.name}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                {sel.players && <div style={{ fontSize: 11, color: "#4a5568" }}>{sel.players} sp</div>}
                <div style={{ fontSize: 11, color: sel.intensity === "Hög" ? "#f87171" : sel.intensity === "Medel" ? "#fbbf24" : "#34d399" }}>{sel.intensity}</div>
                <button
                  onClick={e => toggleFav(e, sel.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "2px 0", minHeight: 32, minWidth: 32, display: "flex", alignItems: "center", justifyContent: "center", color: favorites.has(sel.id) ? "#fbbf24" : "#4a5568" }}
                  aria-label={favorites.has(sel.id) ? "Ta bort favorit" : "Lägg till favorit"}
                >
                  {favorites.has(sel.id) ? "★" : "☆"}
                </button>
              </div>
            </div>
            {[["VAD", sel.vad], ["VARFÖR", sel.varfor], ["HUR", sel.hur], ["ORGANISATION", sel.organisation]].filter(([, t]) => t).map(([l, t]) => (
              <div key={l} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{t}</div>
              </div>
            ))}
            {(sel.tips || []).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 6 }}>TIPS</div>
                {(sel.tips || []).map((t, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", marginTop: 5, flexShrink: 0 }} /><span style={{ fontSize: 13, color: "#94a3b8" }}>{t}</span></div>)}
              </div>
            )}
            {(sel.coaching_fragor || []).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 6 }}>COACHINGFRÅGOR</div>
                {(sel.coaching_fragor || []).map((t, i) => <div key={i} style={{ fontSize: 13, color: "#38bdf8", marginBottom: 4 }}>- {t}</div>)}
              </div>
            )}
            <button onClick={() => setSel(null)} style={{ width: "100%", padding: "12px 0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "transparent", color: "#4a5568", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Stäng</button>
          </div>
        </div>
      )}
    </div>
  );
}
