import { useState } from "react";
import { sbPost, sbPatch } from "../../lib/supabase.js";
import { CATEGORIES, INTENSITIES, CAT_COLOR } from "../../lib/constants.js";

const CATS_FORM = CATEGORIES.filter(c => c !== "Alla");

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
export default function CreateExerciseForm({ token, onSaved, onCancel, initialData = null }) {
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
    <div className="hibs-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 300, display: "flex", alignItems: "flex-end" }}>
      <div className="hibs-sheet" style={{ width: "100%", maxWidth: 430, margin: "0 auto", background: "#161926", borderRadius: "20px 20px 0 0", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", maxHeight: "95vh" }}>

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
