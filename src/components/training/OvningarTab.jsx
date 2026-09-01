import { useState, useCallback } from "react";
import { sbPatch } from "../../lib/supabase.js";
import ls from "../../lib/storage.js";
import ExerciseDetailSheet from "./ExerciseDetailSheet.jsx";
import CreateExerciseForm from "./CreateExerciseForm.jsx";
import DrawingOverlay from "./DrawingOverlay.jsx";
import FilterChips from "./FilterChips.jsx";
import ExerciseListItem from "./ExerciseListItem.jsx";

const FAV_KEY   = "hibs_fav_ex";

/* ─── Main component ───
   Sprint 67: exercises-state lyft till App.jsx (T: dubbelladdning löst).
   App laddar övningslistan EN gång i loadData() (lätt kolumnlista, utan
   canvas_drawing) och skickar ner exercises + setExercises som props.
   60s-pollingen i App håller nu även övningarna synkade mellan tränare. */
export default function OvningarTab({ token, exercises = [], setExercises }) {
  const [cat,       setCat]         = useState("Alla");
  const [intensity, setIntensity]   = useState("Alla");
  const [search,    setSearch]      = useState("");
  const [sel,       setSel]         = useState(null);
  const [drawing,   setDrawing]     = useState(null); // exercise id being drawn
  const [creating,  setCreating]    = useState(false);
  const [editing,   setEditing]     = useState(null); // exercise being edited
  const [savingId,  setSavingId]    = useState(null);
  const [favorites, setFavorites]   = useState(() => new Set(ls.get(FAV_KEY, [])));

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

      <div style={{ fontSize: 11, color: "#4a5568", marginBottom: 8 }}>{filtered.length} övningar</div>

      {cat === "★ Favoriter" && favorites.size === 0 && (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "#4a5568", fontSize: 13 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>☆</div>
          Tryck på stjärnan på en övning för att spara den som favorit
        </div>
      )}

      {/* Sprint 49 — Tydligt empty-state när filter ger noll träffar.
          Innan: skärmen blev tom och Andreas trodde appen hängde.
          Nu: visar VARFÖR (search, kategori, intensitet) + en återställ-knapp ≥44×44.
          Hoppar över när "★ Favoriter" är valt — där har vi redan ett eget empty-state ovan. */}
      {exercises.length > 0 && filtered.length === 0 && !(cat === "★ Favoriter" && favorites.size === 0) && (
        <div role="status" aria-live="polite"
          style={{ textAlign: "center", padding: "32px 16px", color: "#4a5568", fontSize: 13 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
          <div style={{ marginBottom: 6, color: "#94a3b8" }}>Inga övningar matchar filtren</div>
          <div style={{ fontSize: 11, marginBottom: 12 }}>
            {[
              search    && "sökning: “" + search + "”",
              cat       !== "Alla" && cat !== "★ Favoriter" && "kategori: " + cat,
              intensity !== "Alla" && "intensitet: " + intensity,
            ].filter(Boolean).join(" · ") || "Justera filtren ovan eller skapa en ny övning."}
          </div>
          {(search || cat !== "Alla" || intensity !== "Alla") && (
            <button onClick={() => { setSearch(""); setCat("Alla"); setIntensity("Alla"); }}
              aria-label="Återställ alla filter"
              style={{
                minHeight: 44, padding: "10px 18px",
                background: "rgba(34,197,94,0.10)", color: "#22c55e",
                border: "1px solid rgba(34,197,94,0.3)", borderRadius: 99,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
              Återställ filter
            </button>
          )}
        </div>
      )}

      {/* Exercise list */}
      {filtered.map(ex => (
        <ExerciseListItem
          key={ex.id}
          ex={ex}
          isFav={favorites.has(ex.id)}
          onSelect={() => setSel(ex)}
          onToggleFav={toggleFav}
        />
      ))}

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
