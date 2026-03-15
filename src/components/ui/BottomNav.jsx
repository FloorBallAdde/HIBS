/**
 * BottomNav — 2026-stil med SVG-ikoner och pill-indikator.
 * Props: tab, setTab, setMerSub
 */

function HomeIcon({ active }) {
  const c = active ? "#22c55e" : "#3a4257";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 11.5L12 5l8 6.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 11.5V19.5a.5.5 0 00.5.5H9v-4.5h6V20h4.5a.5.5 0 00.5-.5v-8"
        stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TrainingIcon({ active }) {
  const c = active ? "#22c55e" : "#3a4257";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="13" cy="12" r="4.5" stroke={c} strokeWidth="1.7"
        fill={active ? "rgba(34,197,94,0.1)" : "none"}/>
      <path d="M5 9h4.5m-2.2-2v5" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <circle cx="13" cy="12" r="1.3" fill={c}/>
      <path d="M18 7.5l1.2-1.2" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <circle cx="19.8" cy="5.8" r="1.2" stroke={c} strokeWidth="1.4"/>
    </svg>
  );
}

function MatchIcon({ active }) {
  const c = active ? "#22c55e" : "#3a4257";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3L4 6.5v5C4 15.5 7.5 19.5 12 21c4.5-1.5 8-5.5 8-9.5v-5L12 3z"
        stroke={c} strokeWidth="1.7" strokeLinejoin="round"
        fill={active ? "rgba(34,197,94,0.10)" : "none"}/>
      <path d="M13.5 8.5l-3 3.5h3l-3 3.5" stroke={c} strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MerIcon({ active }) {
  const c = active ? "#22c55e" : "#3a4257";
  const pts = [[7,7],[12,7],[17,7],[7,12],[12,12],[17,12],[7,17],[12,17],[17,17]];
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {pts.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={2.2}
          fill={c} opacity={active && i !== 4 ? 0.45 : 1}/>
      ))}
    </svg>
  );
}

const TABS = [
  { id: "home",    label: "Hem",     Icon: HomeIcon     },
  { id: "traning", label: "Träning", Icon: TrainingIcon },
  { id: "match",   label: "Match",   Icon: MatchIcon    },
  { id: "mer",     label: "Mer",     Icon: MerIcon      },
];

export default function BottomNav({ tab, setTab, setMerSub }) {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(8,10,17,0.94)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderTop: "1px solid rgba(255,255,255,0.055)",
      display: "flex",
      padding: "6px 10px 18px",
      gap: 6,
      zIndex: 100,
    }}>
      {TABS.map(({ id, label, Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => { setTab(id); if (id !== "mer") setMerSub(null); }}
            style={{
              flex: 1,
              position: "relative",
              border: "none",
              background: active
                ? "linear-gradient(160deg,rgba(34,197,94,0.13),rgba(34,197,94,0.06))"
                : "transparent",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "10px 0 12px",
              cursor: "pointer",
              fontFamily: "inherit",
              outline: "none",
              WebkitTapHighlightColor: "transparent",
              transition: "background 0.2s ease",
            }}
          >
            {/* Top accent line when active */}
            <div style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: active ? 24 : 0,
              height: 2,
              borderRadius: "0 0 4px 4px",
              background: "linear-gradient(90deg,#16a34a,#22c55e,#4ade80)",
              transition: "width 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              opacity: active ? 1 : 0,
            }}/>

            <Icon active={active} />

            <span style={{
              fontSize: 9,
              fontWeight: active ? 800 : 600,
              letterSpacing: "0.07em",
              color: active ? "#22c55e" : "#3a4257",
              transition: "color 0.2s ease",
            }}>
              {label.toUpperCase()}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
