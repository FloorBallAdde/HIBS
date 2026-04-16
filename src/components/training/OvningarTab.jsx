import { useState, useEffect, useCallback } from "react";
import { sbGet, sbPatch } from "../../lib/supabase.js";
import { CATEGORIES, INTENSITIES, CAT_COLOR, CAT_DESC } from "../../lib/constants.js";
import ls from "../../lib/storage.js";
import TaktiktavlaTab from "./TaktiktavlaTab.jsx";
import ExerciseDetailSheet from "./ExerciseDetailSheet.jsx";
import CreateExerciseForm from "./CreateExerciseForm.jsx";

const FAV_KEY   = "hibs_fav_ex";

/* ─── Main component ─── */
export default function OvningarTab({ token }) {
  const [exercises, setExercises]   = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [cat,       setCat]         = useState("Alla");
  const [intensity, setIntensity]   = useState("Alla");
  const [search,    setSearch]      = useState("");
  const [sel,       setSel]         = useState(null);
  const [drawing,   setDrawing]     = useState(null); // exercise id being drawn
  const [creating,  setCreating]    = useState(false);
  const [editing,   setEditing]     = useState(null); // exercise being edited
  const [savingId,  setSavingId]    = useState(null);
  const [favorites, setFavorites]   = useState(() => new Set(ls.get(FAV_KEY, [])));

  const ALL_CATS = ["★ Favoriter", ...CATEGORIES];

  const loadExercises = useCallback(async () => {
    setLoading(true);
    const res = await sbGet("exercises", "order=name.asc", token);
    if (Array.isArray(res)) setExercises(res);
    setLoading(false);
  }, [token]);

  useEffect(() => { loadExercises(); }, [loadExercises]);

  const toggleFav = useCallback((e, id) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
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

  /* ── Save drawing ── */
  const handleSaveDrawing = async (exerciseId, dataURL) => {
    setSavingId(exerciseId);
    try {
      await sbPatch("exercises", exerciseId, { canvas_drawing: dataURL }, token);
      setExercises(prev => prev.map(ex =>
        ex.id === exerciseId ? { ...ex, canvas_drawing: dataURL } : ex
      ));
      if (sel?.id === exerciseId) setSel(prev => ({ ...prev, canvas_drawing: dataURL }));
    } finally {
      setSavingId(null);
      setDrawing(null);
    }
  };

  /* ── After create: add to list and go straight to drawing ── */
  const handleCreated = (newEx) => {
    setExercises(prev => [newEx, ...prev]);
    setCreating(false);
    setDrawing(newEx.id);
  };

  /* ── After edit: update in list ── */
  const handleEdited = (updEx) => {
    setExercises(prev => prev.map(e => e.id === updEx.id ? { ...e, ...updEx } : e));
    if (sel?.id === updEx.id) setSel(prev => ({ ...prev, ...updEx }));
    setEditing(null);
  };

  /* ── Drawing overlay ── */
  if (drawing !== null) {
    const ex = exercises.find(e => e.id === drawing);
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "#0d1117", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 14px", background: "#111827", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700 }}>TAKTIKTAVLA FÖR</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginTop: 2 }}>{ex?.name}</div>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <TaktiktavlaTab
            onSave={(dataURL) => handleSaveDrawing(drawing, dataURL)}
            onCancel={() => setDrawing(null)}
          />
        </div>
        {savingId === drawing && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            <div style={{ color: "#22c55e", fontSize: 16, fontWeight: 800 }}>Sparar ritning...</div>
          </div>
        )}
      </div>
    );
  }

  /* ── Main list ── */
  return (
    <div style={{ position: "relative" }}>
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
              <button key={c} onClick={() => setCat(c)} style={{
                padding: "5px 11px", border: "1px solid " + (active ? activeColor : "rgba(255,255,255,0.07)"),
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

      {/* Intensity filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {INTENSITIES.map(i => (
          <button key={i} onClick={() => setIntensity(i)} style={{
            flex: 1, padding: "5px 0",
            border: "1px solid " + (intensity === i ? "#22c55e" : "rgba(255,255,255,0.07)"),
            borderRadius: 99, background: intensity === i ? "rgba(34,197,94,0.12)" : "transparent",
            color: intensity === i ? "#22c55e" : "#4a5568", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
          }}>{i}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", color: "#4a5568", fontSize: 13, padding: 16 }}>Laddar...</div>}
      <div style={{ fontSize: 11, color: "#4a5568", marginBottom: 8 }}>{filtered.length} övningar</div>

      {cat === "★ Favoriter" && favorites.size === 0 && (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "#4a5568", fontSize: 13 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>☆</div>
          Tryck på stjärnan på en övning för att spara den som favorit
        </div>
      )}

      {/* Exercise list */}
      {filtered.map(ex => {
        const cc = CAT_COLOR[ex.category] || "#64748b";
        const isFav = favorites.has(ex.id);
        const hasDrawing = !!ex.canvas_drawing;
        return (
          <div key={ex.id} onClick={() => setSel(ex)}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 8, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: cc, background: cc + "15", border: "1px solid " + cc + "25", borderRadius: 99, padding: "2px 8px" }}>{ex.category}</span>
                  {!hasDrawing && (
                    <span style={{ fontSize: 10, opacity: 0.3 }} title="Ritning saknas">🎨</span>
                  )}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{ex.name}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>{ex.vad}</div>
                {hasDrawing && (
                  <img
                    src={ex.canvas_drawing}
                    alt=""
                    style={{ width: "100%", height: 60, objectFit: "cover", objectPosition: "center", borderRadius: 8, marginTop: 8, border: "1px solid rgba(255,255,255,0.08)", display: "block" }}
                  />
                )}
              </div>
              <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                {ex.players && <div style={{ fontSize: 11, color: "#4a5568" }}>{ex.players} sp</div>}
                <div style={{ fontSize: 11, color: ex.intensity === "Hög" ? "#f87171" : ex.intensity === "Medel" ? "#fbbf24" : "#34d399" }}>{ex.intensity}</div>
                <button onClick={e => toggleFav(e, ex.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 0", minHeight: 28, minWidth: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isFav ? "★" : "☆"}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Extra padding so FAB doesn't cover last item */}
      <div style={{ height: 80 }} />

      {/* FAB — Skapa ny övning */}
      <button onClick={() => setCreating(true)}
        style={{
          position: "fixed", bottom: 88, right: 20, zIndex: 150,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          border: "none", color: "#fff", fontSize: 26, fontWeight: 300,
          cursor: "pointer", boxShadow: "0 4px 20px rgba(34,197,94,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        +
      </button>

      <ExerciseDetailSheet
        sel={sel}
        onClose={() => setSel(null)}
        onEdit={(ex) => { setSel(null); setEditing(ex); }}
        onDraw={(id) => { setSel(null); setDrawing(id); }}
        favorites={favorites}
        toggleFav={toggleFav}
      />

      {/* Create form */}
      {creating && (
        <CreateExerciseForm token={token} onSaved={handleCreated} onCancel={() => setCreating(false)} />
      )}

      {/* Edit form */}
      {editing && (
        <CreateExerciseForm token={token} initialData={editing} onSaved={handleEdited} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}
