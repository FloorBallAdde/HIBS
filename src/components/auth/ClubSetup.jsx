import { useState } from "react";
import { sbGet, sbPost, sbPatch } from "../../lib/supabase.js";
import ls from "../../lib/storage.js";
import { DEFAULT_PLAYERS } from "../../lib/constants.js";
import { inpStyle, AuthButton } from "./authUi.jsx";

// Klubbval efter lyckad auth: skapa ny klubb, eller sök + gå med i befintlig.
// Extraherad ur AuthScreen.jsx (Sprint 64).
export default function ClubSetup({ authData, onAuth, onPending }) {
  const [step, setStep] = useState("choose");
  const [clubName, setClubName] = useState("");
  const [clubSearch, setClubSearch] = useState("");
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const err = (msg) => { setError(msg); setLoading(false); };

  const doCreateClub = async () => {
    if (!clubName.trim()) return err("Ange klubbnamn");
    setLoading(true); setError("");
    try {
      const { tok, uid, username: uname } = authData;
      const cr = await sbPost("clubs", { name: clubName.trim(), owner_id: uid }, tok);
      if (cr?.code || (cr?.message && !cr?.id)) return err("Klubb fel: " + (cr.message || cr.code || JSON.stringify(cr)));
      const club = Array.isArray(cr) ? cr[0] : cr;
      if (!club?.id) return err("Klubb skapades inte: " + JSON.stringify(cr));
      const existingP = await sbGet("profiles", "id=eq." + uid, tok);
      const pr = (Array.isArray(existingP) && existingP.length > 0)
        ? await sbPatch("profiles", uid, { username: uname, club_id: club.id, role: "owner", approved: true }, tok)
        : await sbPost("profiles", { id: uid, username: uname, club_id: club.id, role: "owner", approved: true }, tok);
      if (pr?.code) return err("Profil fel: " + (pr.message || pr.code));
      for (const p of DEFAULT_PLAYERS) {
        await sbPost("players", { club_id: club.id, name: p.name, group: p.group, role: p.role || "utespelare", matches: 0, note: "", goals: [] }, tok);
      }
      const profile = { id: uid, username: uname, club_id: club.id, role: "owner", approved: true, clubs: club };
      ls.set("hibs_token", tok); ls.set("hibs_uid", uid);
      onAuth({ tok, uid, profile });
    } catch (e) { err("Oväntat fel: " + e.message); }
  };

  const doJoinClub = async (club) => {
    setLoading(true); setError("");
    const { tok, uid, username: uname } = authData;
    // Om klubben saknar ägare (förregistrerad) blir första person ägare + auto-godkänd
    const isUnclaimed = !club.owner_id;
    const role = isUnclaimed ? "owner" : "coach";
    const approved = isUnclaimed ? true : false;
    // Claim klubben om den saknar ägare
    if (isUnclaimed) await sbPatch("clubs", club.id, { owner_id: uid }, tok);
    const existing = await sbGet("profiles", "id=eq." + uid, tok);
    if (Array.isArray(existing) && existing.length > 0) {
      await sbPatch("profiles", uid, { username: uname, club_id: club.id, role, approved }, tok);
    } else {
      await sbPost("profiles", { id: uid, username: uname, club_id: club.id, role, approved }, tok);
    }
    if (isUnclaimed) {
      // Skapa standardspelare för den nyupptagna klubben
      for (const p of DEFAULT_PLAYERS) {
        await sbPost("players", { club_id: club.id, name: p.name, group: p.group, role: p.role || "utespelare", matches: 0, note: "", goals: [] }, tok);
      }
      ls.set("hibs_token", tok); ls.set("hibs_uid", uid);
      const profile = { id: uid, username: uname, club_id: club.id, role: "owner", approved: true, clubs: club };
      setLoading(false);
      return onAuth({ tok, uid, profile });
    }
    setLoading(false); onPending();
  };

  const searchClubs = async () => {
    if (!clubSearch.trim()) return;
    const tok = authData?.tok;
    const res = await sbGet("clubs", "name=ilike.*" + encodeURIComponent(clubSearch.trim()) + "*", tok);
    setClubs(Array.isArray(res) ? res : []);
  };

  if (step === "create") return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 4 }}>Skapa klubb</div>
      <div style={{ fontSize: 12, color: "#4a5568", marginBottom: 20 }}>Du blir ägare och kan bjuda in tränare.</div>
      <input value={clubName} onChange={e => setClubName(e.target.value)} placeholder="Klubbnamn t.ex. HIBS P2015" type="text" style={inpStyle} />
      {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 12 }}>{error}</div>}
      <AuthButton label="Skapa klubb" onClick={doCreateClub} loading={loading} />
      <button onClick={() => setStep("choose")} style={{ width: "100%", padding: "10px 0", border: "none", background: "none", color: "#4a5568", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>Tillbaka</button>
    </div>
  );

  if (step === "join") return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 4 }}>Gå med i klubb</div>
      <div style={{ fontSize: 12, color: "#4a5568", marginBottom: 16, lineHeight: 1.5 }}>
        Skriv in klubbnamnet du fått av tränaren — t.ex. <span style={{ color: "#fff", fontWeight: 700 }}>HIBS P2015</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={clubSearch}
          onChange={e => setClubSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && searchClubs()}
          placeholder="Klistra in eller skriv klubbnamn..."
          autoFocus
          style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#fff", fontSize: 14, padding: "12px 14px", fontFamily: "inherit", outline: "none" }}
        />
        <button onClick={searchClubs} style={{ padding: "12px 16px", background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.3)", borderRadius: 12, color: "#38bdf8", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Sök</button>
      </div>
      {clubs.map(club => (
        <div key={club.id} onClick={() => doJoinClub(club)} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{club.name}</div>
            <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>Tryck för att skicka förfrågan</div>
          </div>
          <span style={{ color: "#22c55e", fontSize: 18 }}>›</span>
        </div>
      ))}
      {clubs.length === 0 && clubSearch && (
        <div style={{ fontSize: 12, color: "#4a5568", textAlign: "center", padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12 }}>
          Inga klubbar hittades — kontrollera stavningen
        </div>
      )}
      {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 10 }}>{error}</div>}
      <button onClick={() => setStep("choose")} style={{ width: "100%", padding: "10px 0", border: "none", background: "none", color: "#4a5568", fontSize: 13, fontFamily: "inherit", cursor: "pointer", marginTop: 8 }}>Tillbaka</button>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 4 }}>Välj klubb</div>
      <div style={{ fontSize: 12, color: "#4a5568", marginBottom: 20 }}>Skapa ny eller gå med i befintlig.</div>
      <button onClick={() => setStep("create")} style={{ width: "100%", padding: "14px 0", border: "2px solid rgba(34,197,94,0.4)", borderRadius: 14, background: "rgba(34,197,94,0.08)", color: "#22c55e", fontSize: 14, fontWeight: 800, fontFamily: "inherit", cursor: "pointer", marginBottom: 10 }}>+ Skapa ny klubb</button>
      <button onClick={() => setStep("join")} style={{ width: "100%", padding: "14px 0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, background: "transparent", color: "#94a3b8", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Gå med i befintlig klubb</button>
    </div>
  );
}
