/**
 * GoalCard — Ett enskilt utvecklingsmål (kollapsbart kort).
 * Sprint 60: extraherad ur GoalModal.jsx för att hålla modalen läsbar.
 * Presentations-/interaktionskomponent — all persistens sköts av föräldern (GoalModal)
 * via onUpdate/onDelete. Ingen egen state utöver det förälder skickar in.
 */

const TYPES   = ["Teknik", "Taktik", "Mental", "Fysik", "Övrigt"];
const SEASONS = ["2024/25", "2025/26", "2026/27"];
const STATUSES = [
  { id: "Pågår",      color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  { id: "Uppnått",    color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  { id: "Ej börjat",  color: "#4a5568", bg: "rgba(74,85,104,0.12)"   },
  { id: "Pausad",     color: "#64748b", bg: "rgba(100,116,139,0.12)" },
];
const statusFor = (s) => STATUSES.find(x => x.id === s) ?? STATUSES[0];

const fmt = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
};

/** Dagar kvar till uppföljning + glance-färg (delas av kollapsad chip & expanderad rad) */
function followUp(dateStr) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr) - new Date()) / (1000*60*60*24));
  if (days < 0)  return { days, color: "#f87171", bg: "rgba(248,113,113,0.1)",  label: `${Math.abs(days)} d sen` };
  if (days === 0) return { days, color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   label: "Idag!" };
  if (days <= 7) return { days, color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   label: `om ${days} d` };
  return            { days, color: "#38bdf8", bg: "rgba(56,189,248,0.08)", label: `om ${days} d` };
}

const TA = ({ value, onChange, placeholder, minHeight = 68, accentColor = "#a78bfa" }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={3}
    style={{
      width: "100%",
      minHeight,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 10,
      color: "#fff",
      fontSize: 13,
      lineHeight: 1.55,
      padding: "9px 12px",
      fontFamily: "inherit",
      outline: "none",
      resize: "vertical",
      boxSizing: "border-box",
      transition: "border-color 0.15s",
    }}
    onFocus={e => { e.target.style.borderColor = accentColor + "60"; }}
    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; }}
  />
);

export default function GoalCard({ goal: g, isOpen, onToggle, onUpdate, onDelete }) {
  const st = statusFor(g.status);
  const fu = followUp(g.followUpDate);

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, marginBottom: 10, overflow: "hidden" }}>
      {/* Goal header — always visible */}
      <div
        onClick={onToggle}
        style={{ padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
      >
        {/* Type + Season */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa", background: "rgba(167,139,250,0.12)", borderRadius: 6, padding: "2px 8px" }}>{g.type}</span>
            <span style={{ fontSize: 10, color: "#4a5568" }}>{g.season}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, borderRadius: 6, padding: "2px 8px" }}>{g.status}</span>
          </div>
          <div style={{ fontSize: 12, color: g.desc ? "#cbd5e1" : "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {g.desc || "Beskriv spelarens mål..."}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {/* Sprint 60: uppföljnings-chippet glance-färgas — röd = försenad, amber = ≤7 d */}
          {fu && g.status !== "Uppnått" && (
            <span style={{ fontSize: 10, fontWeight: 700, color: fu.color, background: fu.bg, borderRadius: 6, padding: "2px 7px" }}>
              📅 {fu.days < 0 ? fu.label : g.followUpDate}
            </span>
          )}
          <span style={{ fontSize: 14, color: "#4a5568" }}>{isOpen ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded content */}
      {isOpen && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Type / Season / Status row */}
          <div style={{ display: "flex", gap: 6, marginTop: 12, marginBottom: 14 }}>
            <select
              value={g.type}
              onChange={e => onUpdate(g.id, { type: e.target.value })}
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12, padding: "7px 8px", fontFamily: "inherit", outline: "none" }}
            >
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={g.season}
              onChange={e => onUpdate(g.id, { season: e.target.value })}
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12, padding: "7px 8px", fontFamily: "inherit", outline: "none" }}
            >
              {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={g.status}
              onChange={e => onUpdate(g.id, { status: e.target.value })}
              style={{ flex: 1, background: st.bg, border: "1px solid " + st.color + "40", borderRadius: 8, color: st.color, fontSize: 12, padding: "7px 8px", fontFamily: "inherit", outline: "none", fontWeight: 700 }}
            >
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
            </select>
          </div>

          {/* 1. Spelarens mål */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#a78bfa", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
              🎯 SPELARENS MÅL
              <span style={{ fontSize: 9, fontWeight: 400, color: "#475569" }}>— vad vill spelaren uppnå?</span>
            </div>
            <TA
              value={g.desc}
              onChange={e => onUpdate(g.id, { desc: e.target.value })}
              placeholder="T.ex. Jag vill bli bättre på att ta emot bollen med vänsterfoten under press..."
              accentColor="#a78bfa"
            />
          </div>

          {/* 2. Tränarfeedback */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#38bdf8", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
              💬 TRÄNARFEEDBACK
              <span style={{ fontSize: 9, fontWeight: 400, color: "#475569" }}>— tränarens observation & bedömning</span>
            </div>
            <TA
              value={g.coachFeedback}
              onChange={e => onUpdate(g.id, { coachFeedback: e.target.value })}
              placeholder="T.ex. Joel visar tydlig förbättring i sin vänsterfot. Bra attityd i träningen — tar till sig feedback snabbt..."
              accentColor="#38bdf8"
            />
          </div>

          {/* 3. Tränarens utmaning */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#fbbf24", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
              ⚡ TRÄNARENS UTMANING
              <span style={{ fontSize: 9, fontWeight: 400, color: "#475569" }}>— konkret uppgift till nästa uppföljning</span>
            </div>
            <TA
              value={g.coachChallenge}
              onChange={e => onUpdate(g.id, { coachChallenge: e.target.value })}
              placeholder="T.ex. 10 min vänsterfotträning hemma 3 gånger i veckan. På varje träning: välj aktivt vänsterfoten i anfall..."
              accentColor="#fbbf24"
              minHeight={80}
            />
          </div>

          {/* Uppföljningsdatum */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#38bdf8", flexShrink: 0 }}>📅 UPPFÖLJNING</div>
            <input
              type="date"
              value={g.followUpDate || ""}
              onChange={e => onUpdate(g.id, { followUpDate: e.target.value })}
              style={{ flex: 1, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 8, color: "#fff", fontSize: 12, padding: "7px 10px", fontFamily: "inherit", outline: "none", colorScheme: "dark" }}
            />
            {fu && (
              <span style={{ fontSize: 11, color: fu.color, fontWeight: 700, flexShrink: 0 }}>{fu.label}</span>
            )}
          </div>

          {/* Senast uppdaterad + radera */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 10, color: "#475569" }}>
              Uppdaterad {fmt(g.updatedAt)}
            </div>
            <button
              onClick={() => onDelete(g.id)}
              style={{ padding: "5px 12px", background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, color: "#f87171", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
            >
              Radera mål
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
