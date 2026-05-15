import MatchCard from "../match/MatchCard.jsx";

/**
 * MatchHistoryView — Visar alla spelade matcher i "Mer"-fliken.
 * Extraherad från MerContent.jsx i Sprint 37.
 */
export default function MatchHistoryView({ history, setHistory, players, tok, setMatchNoteModal, sbDel }) {
  if (history.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "#475569", fontSize: 14 }}>
        Inga matcher sparade ännu.
      </div>
    );
  }

  return (
    <div>
      {history.map(m => (
        <MatchCard key={m.id} match={m}
          players={players}
          tok={tok}
          onEditNote={match => setMatchNoteModal(match)}
          onDelete={async id => { await sbDel("matches", id, tok); setHistory(p => p.filter(x => x.id !== id)); }}
          onUpdate={updated => setHistory(p => p.map(x => x.id === updated.id ? updated : x))}
        />
      ))}
    </div>
  );
}
