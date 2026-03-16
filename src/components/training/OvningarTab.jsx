import { useState, useEffect, useCallback } from "react";
import { sbGet, sbPost, sbPatch } from "../../lib/supabase.js";
import { CATEGORIES, INTENSITIES, CAT_COLOR } from "../../lib/constants.js";
import ls from "../../lib/storage.js";
import TaktiktavlaTab from "./TaktiktavlaTab.jsx";

const FAV_KEY   = "hibs_fav_ex";
const CATS_FORM = CATEGORIES.filter(c => c !== "Alla"); // dropdown options

/* ─── Reusable text field ─── */
const Field = ({ label, value, onChange, placeholder, multiline = false, required = false }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 5 }}>
      {label}{required && <span style={{ color: "#f87171" }}> *</span>}
    </div>
    {multiline
      ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || ""}
          rows={3}
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "10px 12px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }} />
      : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || ""}
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "10px 12px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
    }
  </div>
);

/* ─── Dynamic list input (tips / coachingfrågor) ─── */
const DynamicList = ({ label, items, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 6 }}>{label}</div>
    {items.map((v, i) => (
      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
        <input value={v}
          onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n); }}
          placeholder={`${label} ${i + 1}`}
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "9px 12px", fontFamily: "inherit", outline: "none" }} />
        <button onClick={() => onChange(items.filter((_, j) => j !== i))}
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, color: "#f87171", fontSize: 16, width: 36, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>
          ✕
        </button>
      </div>
    ))}
    <button onClick={() => onChange([...items, ""])}
      style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 10, color: "#4a5568", fontSize: 12, padding: "8px 14px", cursor: "pointer", width: "100%", fontFamily: "inherit" }}>
      + Lägg till
    </button>
  </div>
);

/* ─── Create / Edit Exercise Form ─── */
function CreateExerciseForm({ token, onSaved, onCancel, initialData = null }) {
  const isEdit = !!initialData?.id;
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");
  const [form,   setForm]   = useState({
    name:            initialData?.name            || "",
    category:        initialData?.category        || CATS_FORM[0],
    intensity:       initialData?.intensity       || "Medel",
    players:         initialData?.players         || "",
    vad:             initialData?.vad             || "",
    varfor:          initialData?.varfor          || "",
    hur:             initialData?.hur             || "",
    organisation:    initialData?.organisation    || "",
    tips:            initialData?.tips            || [],
    coaching_fragor: initialData?.coaching_fragor || [],
  });

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim())   return setErr("Namn krävs");
    if (!form.vad.trim())    return setErr("VAD krävs");
    setErr(""); setSaving(true);
    const body = {
      name:            form.name.trim(),
      category:        form.category,
      intensity:       form.intensity,
      players:         form.players.trim() || null,
      vad:             form.vad.trim(),
      varfor:          form.varfor.trim() || null,
      hur:             form.hur.trim()    || null,
      organisation:    form.organisation.trim() || null,
      tips:            form.tips.filter(Boolean),
      coaching_fragor: form.coaching_fragor.filter(Boolean),
    };
    let result;
    if (isEdit) {
      await sbPatch("exercises", initialData.id, body, token);
      result = { ...initialData, ...body };
    } else {
      result = await sbPost("exercises", body, token);
    }
    setSaving(false);
    if (isEdit || result?.id) onSaved(result);
    else setErr("Kunde inte spara. Försök igen.");
  };

  const cc = CAT_COLOR[form.category] || "#64748b";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 300, display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: "100%", maxWidth: 430, margin: "0 auto", background: "#161926", borderRadius: "20px 20px 0 0", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", maxHeight: "95vh" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 0" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{isEdit ? "Redigera övning" : "Ny övning"}</div>
          <button onClick={onCancel}
            style={{ background: "none", border: "none", color: "#4a5568", fontSize: 22, cursor: "pointer", padding: 4, lineHeight: 1, fontFamily: "inherit" }}>✕</button>
        </div>

        <div style={{ overflowY: "auto", padding: "20px 20px 32px", flex: 1 }}>

          <Field label="NAMN" value={form.name} onChange={set("name")} placeholder="T.ex. 2-mot-1 med avslut" required />

          {/* Kategori */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 6 }}>KATEGORI <span style={{ color: "#f87171" }}>*</span></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATS_FORM.map(c => {
                const col = CAT_COLOR[c] || "#64748b";
                const active = form.category === c;
                return (
                  <button key={c} onClick={() => set("category")(c)} style={{
                    padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                    fontFamily: "inherit", cursor: "pointer",
                    background: active ? col + "22" : "transparent",
                    border: "1.5px solid " + (active ? col : "rgba(255,255,255,0.1)"),
                    color: active ? col : "#4a5568",
                  }}>{c}</button>
                );
              })}
            </div>
          </div>

          {/* Intensitet */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 6 }}>INTENSITET <span style={{ color: "#f87171" }}>*</span></div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Låg", "Medel", "Hög"].map(i => {
                const col = i === "Hög" ? "#f87171" : i === "Medel" ? "#fbbf24" : "#34d399";
                const active = form.intensity === i;
                return (
                  <button key={i} onClick={() => set("intensity")(i)} style={{
                    flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
                    fontFamily: "inherit", cursor: "pointer",
                    background: active ? col + "20" : "transparent",
                    border: "1.5px solid " + (active ? col : "rgba(255,255,255,0.1)"),
                    color: active ? col : "#4a5568",
                  }}>{i}</button>
                );
              })}
            </div>
          </div>

          <Field label="ANTAL SPELARE" value={form.players} onChange={set("players")} placeholder="T.ex. 8-12" />
          <Field label="VAD — Vad tränar vi?" value={form.vad} onChange={set("vad")} placeholder="Kort beskrivning av övningen" multiline required />
          <Field label="VARFÖR — Syfte" value={form.varfor} onChange={set("varfor")} placeholder="Vad vill vi att spelarna ska lära sig?" multiline />
          <Field label="HUR — Instruktion" value={form.hur} onChange={set("hur")} placeholder="Steg-för-steg genomförande" multiline />
          <Field label="ORGANISATION — Upplägg" value={form.organisation} onChange={set("organisation")} placeholder="Hur sätter man upp planen?" multiline />

          <DynamicList label="TIPS" items={form.tips} onChange={set("tips")} />
          <DynamicList label="COACHINGFRÅGOR" items={form.coaching_fragor} onChange={set("coaching_fragor")} />

          {err && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{err}</div>}

          <button onClick={save} disabled={saving} style={{
            width: "100%", padding: "14px 0", borderRadius: 12, fontSize: 15, fontWeight: 800,
            fontFamily: "inherit", cursor: saving ? "wait" : "pointer",
            background: saving ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.15)",
            border: "1.5px solid rgba(34,197,94,0.4)", color: "#22c55e",
          }}>
            {saving ? "Sparar..." : isEdit ? "💾 Spara ändringar" : "💾 Spara & rita taktiktavla →"}
          </button>
        </div>
      </div>
    </div>
  );
}

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

  /* ── Exercise detail sheet ── */
  const DetailSheet = () => {
    if (!sel) return null;
    const cc = CAT_COLOR[sel.category] || "#64748b";
    const isFav = favorites.has(sel.id);
    const hasDrawing = !!sel.canvas_drawing;
    return (
      <div onClick={() => setSel(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "#161926", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", width: "100%", maxWidth: 430, maxHeight: "92vh", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 800, color: cc, background: cc + "18", border: "1px solid " + cc + "30", borderRadius: 99, padding: "3px 10px" }}>{sel.category}</span>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginTop: 8 }}>{sel.name}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              {sel.players && <div style={{ fontSize: 11, color: "#4a5568" }}>{sel.players} sp</div>}
              <div style={{ fontSize: 11, color: sel.intensity === "Hög" ? "#f87171" : sel.intensity === "Medel" ? "#fbbf24" : "#34d399" }}>{sel.intensity}</div>
              <button onClick={e => toggleFav(e, sel.id)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "2px 0", color: isFav ? "#fbbf24" : "#4a5568" }}>
                {isFav ? "★" : "☆"}
              </button>
            </div>
          </div>

          {/* Taktiktavla */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700 }}>TAKTIKTAVLA</div>
              <button onClick={() => { setSel(null); setDrawing(sel.id); }}
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8, color: "#22c55e", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", padding: "4px 10px" }}>
                {hasDrawing ? "✏️ Redigera" : "🎨 Rita"}
              </button>
            </div>
            {hasDrawing ? (
              <img src={sel.canvas_drawing} alt="Taktiktavla"
                style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", display: "block" }} />
            ) : (
              <div onClick={() => { setSel(null); setDrawing(sel.id); }}
                style={{ background: "rgba(239,68,68,0.05)", border: "1.5px dashed rgba(239,68,68,0.3)", borderRadius: 12, padding: "22px 16px", textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🎨</div>
                <div style={{ fontSize: 12, color: "#f87171", fontWeight: 700 }}>Ritning saknas</div>
                <div style={{ fontSize: 11, color: "#4a5568", marginTop: 4 }}>Tryck för att rita på tavlan</div>
              </div>
            )}
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
              {sel.tips.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", marginTop: 5, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>{t}</span>
                </div>
              ))}
            </div>
          )}

          {(sel.coaching_fragor || []).length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 6 }}>COACHINGFRÅGOR</div>
              {sel.coaching_fragor.map((t, i) => (
                <div key={i} style={{ fontSize: 13, color: "#38bdf8", marginBottom: 4 }}>- {t}</div>
              ))}
            </div>
          )}

          <button
            onClick={() => { setSel(null); setEditing(sel); }}
            style={{ width: "100%", padding: "12px 0", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 12, background: "rgba(167,139,250,0.06)", color: "#a78bfa", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginBottom: 8 }}>
            ✏️ Redigera övning
          </button>
          <button onClick={() => setSel(null)}
            style={{ width: "100%", padding: "12px 0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: "transparent", color: "#4a5568", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
            Stäng
          </button>
        </div>
      </div>
    );
  };

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
                  <span style={{ fontSize: 10, opacity: 0.6 }} title={hasDrawing ? "Taktiktavla finns" : "Ritning saknas"}>
                    {hasDrawing ? "🎨✓" : "🎨✗"}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{ex.name}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>{ex.vad}</div>
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

      <DetailSheet />

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
