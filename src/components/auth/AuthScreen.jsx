import { useState } from "react";
import { sbAuth, sbGet, sbPost, sbPatch } from "../../lib/supabase.js";
import ls from "../../lib/storage.js";
import { DEFAULT_PLAYERS } from "../../lib/constants.js";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [clubName, setClubName] = useState("");
  const [clubSearch, setClubSearch] = useState("");
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authData, setAuthData] = useState(null);

  const err = (msg) => { setError(msg); setLoading(false); };
  const inpStyle = { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#fff", fontSize: 14, padding: "12px 14px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 };

  const doRegister = async () => {
    if (!email || !password || !username) return err("Fyll i alla fält");
    if (password.length < 6) return err("Minst 6 tecken i lösenordet");
    setLoading(true); setError("");
    const res = await sbAuth("signup", { email, password, data: { username } });
    if (res.error) return err(res.error.message || "Registrering misslyckades");
    // Om mailbekräftelse är AV returnerar Supabase session direkt
    if (res.access_token) {
      const tok = res.access_token; const uid = res.user.id;
      if (res.refresh_token) ls.set("hibs_refresh", res.refresh_token);
      setAuthData({ tok, uid, username });
      setLoading(false);
      setMode("choose_club");
    } else {
      // Mailbekräftelse är PÅ — visa "kolla mailen"
      setMode("check_email");
      setLoading(false);
    }
  };

  const doLogin = async () => {
    if (!email || !password) return err("Fyll i email och lösenord");
    setLoading(true); setError("");
    const res = await sbAuth("token?grant_type=password", { email, password });
    if (res.error) return err(res.error.message || "Fel email eller lösenord");
    const tok = res.access_token; const uid = res.user.id;
    if (res.refresh_token) ls.set("hibs_refresh", res.refresh_token);
    const prof = await sbGet("profiles", "id=eq." + uid + "&select=*", tok);
    const profile = Array.isArray(prof) && prof[0] ? prof[0] : null;
    if (!profile) return err("Profil: " + JSON.stringify(prof).slice(0, 150));
    if (!profile.club_id) { setAuthData({ tok, uid, username: profile.username || username }); setMode("choose_club"); setLoading(false); return; }
    if (!profile.approved && profile.role !== "owner" && profile.role !== "admin") { setLoading(false); setMode("pending"); return; }
    ls.set("hibs_token", tok); ls.set("hibs_uid", uid);
    onAuth({ tok, uid, profile });
  };

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
      const { DEFAULT_PLAYERS } = await import("../../lib/constants.js");
      for (const p of DEFAULT_PLAYERS) {
        await sbPost("players", { club_id: club.id, name: p.name, group: p.group, role: p.role || "utespelare", matches: 0, note: "", goals: [] }, tok);
      }
      ls.set("hibs_token", tok); ls.set("hibs_uid", uid);
      const profile = { id: uid, username: uname, club_id: club.id, role: "owner", approved: true, clubs: club };
      setLoading(false);
      return onAuth({ tok, uid, profile });
    }
    setLoading(false); setMode("pending");
  };

  const searchClubs = async () => {
    if (!clubSearch.trim()) return;
    const tok = authData?.tok;
    const res = await sbGet("clubs", "name=ilike.*" + encodeURIComponent(clubSearch.trim()) + "*", tok);
    setClubs(Array.isArray(res) ? res : []);
  };

  const Btn = ({ label, onClick }) => (
    <button onClick={onClick} disabled={loading}
      style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 14, background: loading ? "rgba(255,255,255,0.06)" : "#a78bfa", color: loading ? "#4a5568" : "#fff", fontSize: 15, fontWeight: 900, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", marginBottom: 10 }}>
      {loading ? "Väntar..." : label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0b0d14", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-1px" }}>HIBS</div>
          <div style={{ fontSize: 12, color: "#4a5568", marginTop: 4 }}>Tränarapp P2015</div>
        </div>

        {mode === "check_email" && (
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 16, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📧</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Kolla din mail!</div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 16 }}>Vi har skickat en bekräftelselänk till <span style={{ color: "#fff", fontWeight: 700 }}>{email}</span>. Klicka på länken och logga sedan in här.</div>
            <button onClick={() => setMode("login")} style={{ padding: "12px 24px", border: "none", borderRadius: 12, background: "#a78bfa", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Gå till inloggning</button>
          </div>
        )}

        {mode === "pending" && (
          <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 16, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 26, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Väntar på godkännande</div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 16 }}>Klubbägaren behöver godkänna dig.</div>
            <button onClick={() => setMode("login")} style={{ padding: "10px 24px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 99, background: "transparent", color: "#4a5568", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>Tillbaka</button>
          </div>
        )}

        {(mode === "login" || mode === "register") && (
          <div>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
              {[["login", "Logga in"], ["register", "Registrera"]].map(([m, l]) => (
                <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 9, background: mode === m ? "rgba(255,255,255,0.08)" : "transparent", color: mode === m ? "#fff" : "#4a5568", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>{l}</button>
              ))}
            </div>
            {mode === "register" && <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Användarnamn" type="text" style={inpStyle} />}
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={inpStyle} />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Lösenord" type="password" style={inpStyle} />
            {mode === "register" && <div style={{ fontSize: 11, color: "#4a5568", marginBottom: 12, lineHeight: 1.5 }}>Välj ett säkert lösenord med minst 6 tecken.</div>}
            {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 12 }}>{error}</div>}
            <Btn label={mode === "login" ? "Logga in" : "Skapa konto"} onClick={mode === "login" ? doLogin : doRegister} />
          </div>
        )}

        {mode === "choose_club" && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 4 }}>Välj klubb</div>
            <div style={{ fontSize: 12, color: "#4a5568", marginBottom: 20 }}>Skapa ny eller gå med i befintlig.</div>
            <button onClick={() => setMode("create_club")} style={{ width: "100%", padding: "14px 0", border: "2px solid rgba(34,197,94,0.4)", borderRadius: 14, background: "rgba(34,197,94,0.08)", color: "#22c55e", fontSize: 14, fontWeight: 800, fontFamily: "inherit", cursor: "pointer", marginBottom: 10 }}>+ Skapa ny klubb</button>
            <button onClick={() => setMode("join_club")} style={{ width: "100%", padding: "14px 0", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, background: "transparent", color: "#94a3b8", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Gå med i befintlig klubb</button>
          </div>
        )}

        {mode === "create_club" && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 4 }}>Skapa klubb</div>
            <div style={{ fontSize: 12, color: "#4a5568", marginBottom: 20 }}>Du blir ägare och kan bjuda in tränare.</div>
            <input value={clubName} onChange={e => setClubName(e.target.value)} placeholder="Klubbnamn t.ex. HIBS P2015" type="text" style={inpStyle} />
            {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 12 }}>{error}</div>}
            <Btn label="Skapa klubb" onClick={doCreateClub} />
            <button onClick={() => setMode("choose_club")} style={{ width: "100%", padding: "10px 0", border: "none", background: "none", color: "#4a5568", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>Tillbaka</button>
          </div>
        )}

        {mode === "join_club" && (
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
            <button onClick={() => setMode("choose_club")} style={{ width: "100%", padding: "10px 0", border: "none", background: "none", color: "#4a5568", fontSize: 13, fontFamily: "inherit", cursor: "pointer", marginTop: 8 }}>Tillbaka</button>
          </div>
        )}
      </div>
    </div>
  );
}
