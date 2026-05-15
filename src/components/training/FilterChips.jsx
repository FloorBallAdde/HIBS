import { CATEGORIES, INTENSITIES, CAT_COLOR, CAT_DESC, intensityColor } from "../../lib/constants.js";

/**
 * FilterChips — sök + kategori-chips + intensitet-filter för OvningarTab.
 *
 * Sprint 46: extraherat från OvningarTab.jsx + touch-target ≥44px på alla chips
 * (kategori-rad + intensitet-rad) för rink-bruk med kalla händer. Visuell tighet
 * bevarad: chips ser fortfarande pill-formade ut, men hit-arean fyller hela
 * minHeight (44px) via flex-centrerad text.
 *
 * Props:
 *   search, setSearch       → sök-input
 *   cat, setCat             → vald kategori ("Alla" | "★ Favoriter" | CATEGORIES[i])
 *   intensity, setIntensity → vald intensitet ("Alla" | "Låg" | "Medel" | "Hög")
 *   favorites               → Set<id> (visar antal i ★ Favoriter-knappen)
 */
export default function FilterChips({
  search, setSearch,
  cat, setCat,
  intensity, setIntensity,
  favorites,
}) {
  const ALL_CATS = ["★ Favoriter", ...CATEGORIES];

  return (
    <>
      {/* Search */}
      <div style={{ marginBottom: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök övning..."
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, color: "#fff", fontSize: 13, padding: "10px 14px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Category chips */}
      <div style={{ overflowX: "auto", marginBottom: 8, paddingBottom: 2 }}>
        <div style={{ display: "flex", gap: 6, width: "max-content" }}>
          {ALL_CATS.map(c => {
            const isFavBtn = c === "★ Favoriter";
            const active   = cat === c;
            const activeColor = isFavBtn ? "#fbbf24" : "#22c55e";
            return (
              <button key={c} onClick={() => setCat(c)}
                title={"Filtrera kategori: " + c}
                aria-label={"Filtrera kategori " + c}
                aria-pressed={active}
                style={{
                  minHeight: 44, padding: "0 14px",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid " + (active ? activeColor : "rgba(255,255,255,0.07)"),
                  borderRadius: 99, background: active ? activeColor + "20" : "transparent",
                  color: active ? activeColor : isFavBtn ? "#fbbf24" : "#4a5568",
                  fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap",
                }}>{c}{isFavBtn && favorites.size > 0 ? ` (${favorites.size})` : ""}</button>
            );
          })}
        </div>
      </div>

      {/* Category description — visas när en specifik kategori är vald */}
      {cat !== "Alla" && cat !== "★ Favoriter" && CAT_DESC[cat] && (
        <div style={{
          background: (CAT_COLOR[cat] || "#64748b") + "08",
          border: "1px solid " + (CAT_COLOR[cat] || "#64748b") + "20",
          borderRadius: 10,
          padding: "8px 12px",
          marginBottom: 10,
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
        }}>
          <span style={{ fontSize: 14, lineHeight: "20px", flexShrink: 0 }}>💡</span>
          <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{CAT_DESC[cat]}</span>
        </div>
      )}

      {/* Intensity filter — Sprint 45: aktiv knapp använder semantisk INTENSITY_COLOR
          (Låg=grön, Medel=gul, Hög=röd). "Alla" stannar neutralt grön (#22c55e).
          Sprint 46: hit-area höjd till ≥44px för rink-bruk med kalla händer. */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {INTENSITIES.map(i => {
          const col    = i === "Alla" ? "#22c55e" : intensityColor(i);
          const active = intensity === i;
          return (
            <button key={i} onClick={() => setIntensity(i)}
              title={"Filtrera intensitet: " + i}
              aria-label={"Filtrera intensitet " + i}
              aria-pressed={active}
              style={{
                flex: 1, minHeight: 44, padding: 0,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                border: "1px solid " + (active ? col : "rgba(255,255,255,0.07)"),
                borderRadius: 99, background: active ? col + "20" : "transparent",
                color: active ? col : "#4a5568",
                fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
              }}>{i}</button>
          );
        })}
      </div>
    </>
  );
}
