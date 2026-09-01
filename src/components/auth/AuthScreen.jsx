import { useState } from "react";
import { sbAuth, sbGet, sbPost, sbPatch } from "../../lib/supabase.js";
import ls from "../../lib/storage.js";
import { inpStyle, AuthButton } from "./authUi.jsx";
import ClubSetup from "./ClubSetup.jsx";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authData, setAuthData] = useState(null);

  // P11 Fas 2 Steg 2: Invite-länk — ?invite=CLUB_ID&role=parent
  const [invite] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const clubId = params.get("invite");
    const role = params.get("role");
    if (clubId && role === "parent") return { clubId, role };
    return null;
  });

  const err = (msg) => { setError(msg); setLoading(false); };

  const doRegister = async () => {
    if (!email || !password || !username) return err("Fyll i alla fält");
    if (password.length < 6) return err("Minst 6 tecken i lösenordet");
    setLoading(true); setError("");
    try {
      const res = await sbAuth("signup", { email, password, data: { username } });
      if (res.error) return err(res.error.message || "Registrering misslyckades");
      // Om mailbekräftelse är AV returnerar Supabase session direkt
      if (res.access_token) {
        const tok = res.access_token; const uid = res.user?.id;
        if (!tok || !uid) return err("Registrering misslyckades — försök igen");
        if (res.refresh_token) ls.set("hibs_refresh", res.refresh_token);
        // P11 Fas 2: Om invite-länk → auto-join som förälder
        if (invite) { const ok = await doInviteJoin(tok, uid, username); if (ok) return; }
        setAuthData({ tok, uid, username });
        setLoading(false);
        setMode("choose_club");
      } else {
        // Mailbekräftelse är PÅ — visa "kolla mailen"
        setMode("check_email");
        setLoading(false);
      }
    } catch (e) { err("Nätverksfel — kontrollera anslutningen och försök igen."); }
  };

  const doLogin = async () => {
    if (!email || !password) return err("Fyll i email och lösenord");
    setLoading(true); setError("");
    try {
      const res = await sbAuth("token?grant_type=password", { email, password });
      if (res.error) return err(res.error.message || "Fel email eller lösenord");
      const tok = res.access_token; const uid = res.user?.id;
      if (!tok || !uid) return err("Inloggningen misslyckades — försök igen");
      if (res.refresh_token) ls.set("hibs_refresh", res.refresh_token);
      const prof = await sbGet("profiles", "id=eq." + uid + "&select=*", tok);
      const profile = Array.isArray(prof) && prof[0] ? prof[0] : null;
      if (!profile) return err("Profil: " + JSON.stringify(prof).slice(0, 150));
      // P11 Fas 2: Om invite-länk och användaren inte redan tillhör en klubb → auto-join
      if (!profile.club_id && invite) { const ok = await doInviteJoin(tok, uid, profile.username || username); if (ok) return; }
      if (!profile.club_id) { setAuthData({ tok, uid, username: profile.username || username }); setMode("choose_club"); setLoading(false); return; }
      if (!profile.approved && profile.role !== "owner" && profile.role !== "admin") { setLoading(false); setMode("pending"); return; }
      ls.set("hibs_token", tok); ls.set("hibs_uid", uid);
      onAuth({ tok, uid, profile });
    } catch (e) { err("Nätverksfel — kontrollera anslutningen och försök igen."); }
  };

  // P11 Fas 2 Steg 2: Auto-join as parent via invite link
  const doInviteJoin = async (tok, uid, uname) => {
    if (!invite) return false;
    setLoading(true); setError("");
    try {
      // Verify club exists
      const res = await sbGet("clubs", "id=eq." + invite.clubId, tok);
      const club = Array.isArray(res) && res[0] ? res[0] : null;
      if (!club) { err("Klubben hittades inte — länken kan vara felaktig."); return false; }
      // Create or update profile with role=parent, auto-approved
      const existing = await sbGet("profiles", "id=eq." + uid, tok);
      if (Array.isArray(existing) && existing.length > 0) {
        await sbPatch("profiles", uid, { username: uname || existing[0].username, club_id: club.id, role: "parent", approved: true }, tok);
      } else {
        await sbPost("profiles", { id: uid, username: uname, club_id: club.id, role: "parent", approved: true }, tok);
      }
      // Clean invite params from URL (cosmetic)
      try { window.history.replaceState({}, "", window.location.pathname); } catch { /* ignore */ }
      const profile = { id: uid, username: uname, club_id: club.id, role: "parent", approved: true, clubs: club };
      ls.set("hibs_token", tok); ls.set("hibs_uid", uid);
      onAuth({ tok, uid, profile });
      return true;
    } catch (e) { err("Kunde inte gå med — försök igen."); return false; }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b0d14", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-1px" }}>HIBS</div>
          <div style={{ fontSize: 12, color: "#4a5568", marginTop: 4 }}>Tränarapp P2015</div>
        </div>

        {/* P11 Fas 2: Invite banner för föräldrar */}
        {invite && (mode === "login" || mode === "register") && (
          <div style={{
            background: "rgba(244,114,182,0.06)",
            border: "1px solid rgba(244,114,182,0.2)",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 20,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>👪</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f472b6" }}>Föräldra-inbjudan</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, lineHeight: 1.5 }}>
              Registrera dig eller logga in för att se lagets meddelanden och matchschema.
            </div>
          </div>
        )}

        {mode === "check_email" && (
          <div style={{
            background: invite ? "rgba(244,114,182,0.08)" : "rgba(34,197,94,0.08)",
            border: "1px solid " + (invite ? "rgba(244,114,182,0.25)" : "rgba(34,197,94,0.25)"),
            borderRadius: 16,
            padding: 24,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{invite ? "👪" : "📧"}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
              {invite ? "Du har en föräldra-inbjudan!" : "Kolla din mail!"}
            </div>
            {invite ? (
              <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6, marginBottom: 16, textAlign: "left" }}>
                Vi har skickat en bekräftelselänk till <span style={{ color: "#fff", fontWeight: 700 }}>{email}</span>.
                <ol style={{ paddingLeft: 20, marginTop: 10, marginBottom: 0, color: "#94a3b8" }}>
                  <li style={{ marginBottom: 4 }}>Öppna mailet och klicka på bekräftelselänken.</li>
                  <li style={{ marginBottom: 4 }}>Kom tillbaka hit och logga in.</li>
                  <li>Du läggs automatiskt till som <span style={{ color: "#f472b6", fontWeight: 700 }}>förälder</span> i laget och ser matchschema och meddelanden.</li>
                </ol>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 16 }}>
                Vi har skickat en bekräftelselänk till <span style={{ color: "#fff", fontWeight: 700 }}>{email}</span>. Klicka på länken och logga sedan in här.
              </div>
            )}
            <button onClick={() => setMode("login")} style={{
              padding: "12px 24px",
              border: "none",
              borderRadius: 12,
              background: invite ? "#f472b6" : "#a78bfa",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              minHeight: 44,
            }}>Gå till inloggning</button>
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
            {/* Sprint 64: Visa/dölj lösenord — färre felinloggningar med kalla händer */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Lösenord" type={showPw ? "text" : "password"} style={{ ...inpStyle, paddingRight: 52, marginBottom: 0 }} />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                aria-label={showPw ? "Dölj lösenord" : "Visa lösenord"}
                style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 48, border: "none", background: "none", color: "#94a3b8", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              >{showPw ? "🙈" : "👁️"}</button>
            </div>
            {mode === "register" && <div style={{ fontSize: 11, color: "#4a5568", marginBottom: 12, lineHeight: 1.5 }}>Välj ett säkert lösenord med minst 6 tecken.</div>}
            {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 12 }}>{error}</div>}
            <AuthButton label={mode === "login" ? "Logga in" : "Skapa konto"} onClick={mode === "login" ? doLogin : doRegister} loading={loading} />
          </div>
        )}

        {mode === "choose_club" && (
          <ClubSetup authData={authData} onAuth={onAuth} onPending={() => setMode("pending")} />
        )}
      </div>
    </div>
  );
}
