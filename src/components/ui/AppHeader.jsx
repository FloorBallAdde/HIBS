/**
 * AppHeader — Sprint 23 refactoring.
 * Extracted from App.jsx (was inline sticky header block).
 * Props: profile, tab, merSub, onBack, onProfileOpen
 */
export default function AppHeader({ profile, tab, merSub, onBack, onProfileOpen }) {
  const roleColor   = profile?.role === "owner" ? "#a78bfa" : profile?.role === "admin" ? "#60a5fa" : "#22c55e";
  const roleBg      = profile?.role === "owner" ? "rgba(167,139,250,0.1)" : profile?.role === "admin" ? "rgba(96,165,250,0.1)" : "rgba(34,197,94,0.1)";
  const roleBorder  = profile?.role === "owner" ? "rgba(167,139,250,0.3)" : profile?.role === "admin" ? "rgba(96,165,250,0.3)" : "rgba(34,197,94,0.3)";
  const roleLabel   = profile?.role === "owner" ? "👑 Ägare" : profile?.role === "admin" ? "⚡ Admin" : "🏒 Tränare";

  return (
    <div style={{
      position: "sticky", top: 0,
      background: "rgba(11,13,20,0.95)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      padding: "14px 20px",
      zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      {/* Club name + role badge */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>
          {profile?.clubs?.name || "HIBS Tränarapp"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          <span style={{
            fontSize: 10, color: roleColor, fontWeight: 700,
            background: roleBg, padding: "2px 7px", borderRadius: 99,
            border: "1px solid " + roleBorder,
          }}>
            {roleLabel}
          </span>
          <span style={{ fontSize: 10, color: "#4a5568" }}>{profile?.username || ""}</span>
        </div>
      </div>

      {/* Right action — back button or profile avatar */}
      {tab === "mer" && merSub
        ? <button
            onClick={onBack}
            style={{ fontSize: 12, color: "#4a5568", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >‹ Tillbaka</button>
        : <button
            onClick={onProfileOpen}
            title="Profil & inbjudan"
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(167,139,250,0.15)",
              border: "1.5px solid rgba(167,139,250,0.3)",
              color: "#a78bfa", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "inherit", fontWeight: 900,
              flexShrink: 0, overflow: "hidden", padding: 0,
            }}
          >
            {profile?.clubs?.logo_url
              ? <img
                  src={profile.clubs.logo_url}
                  alt=""
                  onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4, boxSizing: "border-box" }}
                />
              : null}
            <span style={{ display: profile?.clubs?.logo_url ? "none" : "flex" }}>
              {(profile?.username || "T")[0].toUpperCase()}
            </span>
          </button>
      }
    </div>
  );
}
