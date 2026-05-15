import { useState, useEffect, useCallback } from "react";
import { sbGet, sbPatch } from "../../lib/supabase.js";
import { CAT_COLOR, intensityColor } from "../../lib/constants.js";
import ls from "../../lib/storage.js";
import ExerciseDetailSheet from "./ExerciseDetailSheet.jsx";
import CreateExerciseForm from "./CreateExerciseForm.jsx";
import DrawingOverlay from "./DrawingOverlay.jsx";
import FilterChips from "./FilterChips.jsx";

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

  const loadExercises = useCallback(async () => {
    setLoading(true);
    const res = await sbGet("exercises", "select=id,name,category,intensity,players,vad,varfor,hur,organisation,tips,coaching_fragor,has_drawing&order=name.asc", token);
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
      // Sprint 40: håll has_drawing synkad med canvas_drawing så listindikatorn (🎨) reflekterar verkligheten direkt.
      await sbPatch("exercises", exerciseId, { canvas_drawing: dataURL, has_drawing: true }, token);
      setExercises(prev => prev.map(ex =>
        ex.id === exerciseId ? { ...ex, canvas_drawing: dataURL, has_drawing: true } : ex
      ));
      if (sel?.id === exerciseId) setSel(prev => ({ ...prev, canvas_drawing: dataURL, has_drawing: true }));
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
      <DrawingOverlay
        exercise={ex}
        onSave={(dataURL) => handleSaveDrawing(drawing, dataURL)}
        onCancel={() => setDrawing(null)}
        saving={savingId === drawing}
      />
    );
  }

  /* ── Main list ── */
  return (
    <div style={{ position: "relative" }}>
      <FilterChips
        search={search} setSearch={setSearch}
        cat={cat} setCat={setCat}
        intensity={intensity} setIntensity={setIntensity}
        favorites={favorites}
      />

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
        return (
          <div key={ex.id} onClick={() => setSel(ex)}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 8, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: cc, background: cc + "15", border: "1px solid " + cc + "25", borderRadius: 99, padding: "2px 8px" }}>{ex.category}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{ex.name}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>{ex.vad}</div>
              </div>
              <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                {ex.players && <div style={{ fontSize: 11, color: "#4a5568" }}>{ex.players} sp</div>}
                <div style={{ fontSize: 11, color: intensityColor(ex.intensity) }}>{ex.intensity}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {ex.has_drawing && (
                    <span title="Har taktiktavla-ritning" aria-label="Har ritning"
                      style={{ fontSize: 13, lineHeight: 1, opacity: 0.85 }}>🎨</span>
                  )}
                  <button onClick={e => toggleFav(e, ex.id)}
                    title={isFav ? "Ta bort från favoriter" : "Spara som favorit"}
                    aria-label={isFav ? "Ta bort " + ex.name + " från favoriter" : "Spara " + ex.name + " som favorit"}
                    aria-pressed={isFav}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 0, minHeight: 44, minWidth: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", color: isFav ? "#fbbf24" : "#4a5568" }}>
                    {isFav ? "★" : "☆"}
                  </button>
                </div>
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
        token={token}
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
