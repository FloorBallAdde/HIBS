/**
 * ProfilePanel — bottom-sheet profilpanel.
 */
import { useState } from "react";
import ClubProfileModal from "./ClubProfileModal.jsx";

export default function ProfilePanel({ profile, profileOpen, setProfileOpen, coachStaff, pendingCoaches, onSignOut, onUpdateClub }) {
  const [editingClub, setEditingClub] = useState(false);
  if (!profileOpen) return null;

  const club = profile?.clubs;
  const isOwnerOrAdmin = profile?.role === "owner" || profile?.role === "admin";

  const handleSaveClub = async (patch) => {
    if (onUpdateClub) await onUpdateClub(patch);
    setEditingClub(false);
  };

  return (
    <>
      <div
        onClick={() => setProfileOpen(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 300, display: "flex", alignItems: "flex-end" }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ width: "100%", background: "#111827", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", boxSizing: "border-box", maxHeight: "90vh", overflowY: "auto" }}
        >
          {/* ── Klubbrubrik med logga ─────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Logga */}
              {club?.logo_url
                ? <img src={club.logo_url} alt="logga" onError={e=>e.target.style.display="none"} style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: 4, flexShrink: 0 }} />
                : <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏒</div>
              }
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>{club?.name || "Min klubb"}</div>
                <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>
                  {profile?.username || "Tränare"} · {profile?.role === "owner" ? "👑 Ägare" : profile?.role === "admin" ? "⚡ Admin" : "🏒 Tränare"}
                </div>
              </div>
            </div>
            <button onClick={() => setProfileOpen(false)} style={{ background: "none", border: "none", color: "#4a5568", fontSize: 22, cursor: "pointer", padding: 4, lineHeight: 1, fontFamily: "inherit" }}>✕</button>
          </div>

          {/* ── Klubbinfo-kort ────────────────────────────────────── */}
          {(club?.description || club?.arena || club?.founded_year || club?.city || club?.website || isOwnerOrAdmin) && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: club?.description ? 10 : 0 }}>
                <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700 }}>OM KLUBBEN</div>
                {isOwnerOrAdmin && (
                  <button onClick={() => setEditingClub(true)} style={{ fontSize: 11, color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 99, padding: "3px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                    ✏️ Redigera
                  </button>
                )}
              </div>
              {club?.description && (
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 10 }}>{club.description}</div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {club?.founded_year && <span style={{ fontSize: 11, color: "#4a5568", background: "rgba(255,255,255,0.04)", borderRadius: 99, padding: "3px 10px" }}>📅 {club.founded_year}</span>}
                {club?.city        && <span style={{ fontSize: 11, color: "#4a5568", background: "rgba(255,255,255,0.04)", borderRadius: 99, padding: "3px 10px" }}>📍 {club.city}</span>}
                {club?.arena       && <span style={{ fontSize: 11, color: "#4a5568", background: "rgba(255,255,255,0.04)", borderRadius: 99, padding: "3px 10px" }}>🏟️ {club.arena}</span>}
                {club?.website     && <a href={club.website} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#60a5fa", background: "rgba(96,165,250,0.08)", borderRadius: 99, padding: "3px 10px", textDecoration: "none" }}>🌐 Webbplats</a>}
              </div>
              {!club?.description && !club?.arena && !club?.founded_year && !club?.city && isOwnerOrAdmin && (
                <div style={{ fontSize: 12, color: "#2d3748", marginTop: 4 }}>Ingen info tillagd än — tryck Redigera för att fylla i.</div>
              )}
            </div>
          )}

          {/* ── Redigera-knapp om kort inte visas ─────────────────── */}
          {isOwnerOrAdmin && !club?.description && !club?.arena && !club?.founded_year && !club?.city && !club?.website && (
            <button
              onClick={() => setEditingClub(true)}
              style={{ width: "100%", padding: "11px 0", background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 12, color: "#a78bfa", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginBottom: 14 }}
            >
              ✏️ Lägg till klubbinfo & logga
            </button>
          )}

          {/* ── Inbjudningskod ────────────────────────────────────── */}
          {isOwnerOrAdmin && (
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, marginBottom: 6 }}>BJUD IN TRÄNARE</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, lineHeight: 1.5 }}>
                Be kollegan ladda ner appen, registrera sig och sedan söka på klubbnamnet nedan i "Gå med i befintlig klubb".
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "0.02em", marginBottom: 10, fontFamily: "monospace", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px" }}>
                {club?.name}
              </div>
              <button
                onClick={() => {
                  if (navigator.clipboard) { navigator.clipboard.writeText(club?.name || ""); }
                  else { const ta = document.createElement("textarea"); ta.value = club?.name || ""; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); }
                }}
                style={{ width: "100%", padding: "11px 0", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, color: "#22c55e", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
              >
                📋 Kopiera klubbnamn
              </button>
            </div>
          )}

          {/* ── Ledarstab ─────────────────────────────────────────── */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#4a5568", fontWeight: 700, marginBottom: 10 }}>LEDARSTAB</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: coachStaff.length > 0 ? 8 : 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(167,139,250,0.15)", border: "1.5px solid rgba(167,139,250,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#a78bfa" }}>
                {(profile?.username || "T")[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{profile?.username}</div>
                <div style={{ fontSize: 10, color: profile?.role === "admin" ? "#60a5fa" : "#a78bfa" }}>{profile?.role === "admin" ? "⚡ Admin" : "👑 Ägare"}</div>
              </div>
            </div>
            {coachStaff.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1.5px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#22c55e" }}>
                  {(c.username || "T")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.username}</div>
                  <div style={{ fontSize: 10, color: c.role === "admin" ? "#60a5fa" : "#22c55e" }}>{c.role === "admin" ? "⚡ Admin" : "🏒 Tränare"}</div>
                </div>
              </div>
            ))}
            {coachStaff.length === 0 && (
              <div style={{ fontSize: 11, color: "#4a5568" }}>Inga co-tränare ännu — bjud in via koden ovan</div>
            )}
          </div>

          {/* ── Väntande tränare ──────────────────────────────────── */}
          {pendingCoaches.length > 0 && (
            <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#fbbf24" }}>
              ⏳ {pendingCoaches.length} tränare väntar på godkännande — godkänn i Mer-fliken
            </div>
          )}

          {/* ── Logga ut ──────────────────────────────────────────── */}
          <button
            onClick={() => { setProfileOpen(false); onSignOut(); }}
            style={{ width: "100%", padding: "13px 0", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, color: "#f87171", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
          >
            Logga ut
          </button>
        </div>
      </div>

      {/* ── Redigera klubbprofil-modal ────────────────────────────── */}
      {editingClub && (
        <ClubProfileModal
          club={club}
          onClose={() => setEditingClub(false)}
          onSave={handleSaveClub}
        />
      )}
    </>
  );
}
