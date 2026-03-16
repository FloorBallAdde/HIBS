import { useState } from "react";

const FIELD = (label, key, type = "text", placeholder = "") => ({ label, key, type, placeholder });
const FIELDS = [
  FIELD("Logga (bild-URL)", "logo_url", "url", "https://..."),
  FIELD("Beskrivning", "description", "textarea", "Berätta om klubben..."),
  FIELD("Stad", "city", "text", "t.ex. Huddinge"),
  FIELD("Hemmaplan / arena", "arena", "text", "t.ex. Tomtbergahallen"),
  FIELD("Grundat år", "founded_year", "number", "t.ex. 1986"),
  FIELD("Webbplats", "website", "url", "https://..."),
  FIELD("Kontakt-e-post", "contact_email", "email", "info@klubben.se"),
];

export default function ClubProfileModal({ club, onClose, onSave }) {
  const [form, setForm] = useState({
    logo_url:      club?.logo_url      || "",
    description:   club?.description   || "",
    city:          club?.city          || "",
    arena:         club?.arena         || "",
    founded_year:  club?.founded_year  || "",
    website:       club?.website       || "",
    contact_email: club?.contact_email || "",
  });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const patch = { ...form, founded_year: form.founded_year ? parseInt(form.founded_year) : null };
    await onSave(patch);
    setSaving(false);
  };

  return (
    <div
      onClick={onClose}
      className="hibs-overlay"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 400, display: "flex", alignItems: "flex-end", fontFamily: "system-ui,sans-serif" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="hibs-sheet"
        style={{ width: "100%", background: "#111827", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", boxSizing: "border-box", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Klubbprofil</div>
            <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>{club?.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4a5568", fontSize: 22, cursor: "pointer", padding: 4, lineHeight: 1 }}>✕</button>
        </div>

        {/* Logo preview */}
        {form.logo_url && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <img
              src={form.logo_url}
              alt="Klubblogga"
              onError={e => { e.target.style.display = "none"; }}
              style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: 8 }}
            />
          </div>
        )}

        {/* Fields */}
        {FIELDS.map(({ label, key, type, placeholder }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            {type === "textarea" ? (
              <textarea
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                rows={3}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "10px 12px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", outline: "none" }}
              />
            ) : (
              <input
                type={type}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "10px 12px", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}
              />
            )}
          </div>
        ))}

        {/* Spara */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: "100%", padding: "13px 0", background: saving ? "rgba(167,139,250,0.15)" : "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.4)", borderRadius: 12, color: "#a78bfa", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: saving ? "default" : "pointer", marginTop: 4 }}
        >
          {saving ? "Sparar…" : "💾 Spara klubbprofil"}
        </button>
      </div>
    </div>
  );
}
