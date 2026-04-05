// src/components/ui/PostMatchFeedback.jsx
// Sprint 27 — Post-match UX feedback overlay
import { useState, useEffect } from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/constants.js';

const DISMISS_AFTER_MS = 8000;

async function saveFeedback({ clubId, uid, rating, note }) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/app_feedback`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${localStorage.getItem('hibs_jwt') || SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ club_id: clubId, uid, rating, note: note || null, app_version: '1.0' }),
    });
  } catch (_) {}
}

export default function PostMatchFeedback({ onClose, clubId, uid }) {
  const [picked, setPicked]   = useState(null);
  const [note, setNote]       = useState('');
  const [sent, setSent]       = useState(false);
  const [countdown, setCountdown] = useState(Math.ceil(DISMISS_AFTER_MS / 1000));

  useEffect(() => {
    if (picked !== null || sent) return;
    if (countdown <= 0) { onClose(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, picked, sent, onClose]);

  async function handlePick(val) {
    setPicked(val);
    if (val === 'up') {
      await saveFeedback({ clubId, uid, rating: 'up', note: '' });
      setSent(true);
      setTimeout(onClose, 1400);
    }
  }

  async function handleSend() {
    await saveFeedback({ clubId, uid, rating: 'down', note });
    setSent(true);
    setTimeout(onClose, 1400);
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.72)',
        display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 0 32px',
        WebkitTapHighlightColor:'transparent' }}>
      <div style={{ background:'#13151f', borderRadius:'20px 20px 16px 16px', width:'100%',
        maxWidth:420, padding:'28px 24px 24px', boxShadow:'0 -4px 32px rgba(0,0,0,0.5)',
        display:'flex', flexDirection:'column', gap:20 }}>

        {sent && (
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <div style={{ fontSize:40 }}>✅</div>
            <p style={{ color:'#22c55e', fontSize:16, margin:'10px 0 0', fontWeight:600 }}>Tack för feedbacken!</p>
          </div>
        )}

        {!sent && picked === null && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ color:'#e2e8f0', fontSize:17, fontWeight:600, margin:0 }}>Hur fungerade appen idag?</p>
              <span style={{ color:'#64748b', fontSize:13 }}>{countdown}s</span>
            </div>
            <div style={{ display:'flex', gap:16 }}>
              <button onClick={() => handlePick('up')} style={{ flex:1, minHeight:80, fontSize:36,
                background:'#1a2e1a', border:'2px solid #22c55e', borderRadius:16, cursor:'pointer',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
                👍<span style={{ color:'#22c55e', fontSize:13, fontWeight:600 }}>Fungerade bra</span>
              </button>
              <button onClick={() => handlePick('down')} style={{ flex:1, minHeight:80, fontSize:36,
                background:'#2e1a1a', border:'2px solid #f87171', borderRadius:16, cursor:'pointer',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
                👎<span style={{ color:'#f87171', fontSize:13, fontWeight:600 }}>Hade problem</span>
              </button>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569',
              fontSize:14, cursor:'pointer', padding:'8px 0', textAlign:'center' }}>Hoppa över</button>
          </>
        )}

        {!sent && picked === 'down' && (
          <>
            <p style={{ color:'#e2e8f0', fontSize:17, fontWeight:600, margin:0 }}>
              Vad gick snett? <span style={{ color:'#64748b', fontWeight:400, fontSize:14 }}>(valfritt)</span>
            </p>
            <textarea autoFocus value={note} onChange={e => setNote(e.target.value)}
              placeholder="T.ex. appen var långsam, byte-funktionen krånglade..."
              rows={3} style={{ background:'#1e2435', border:'1px solid #334155', borderRadius:12,
                color:'#e2e8f0', fontSize:15, padding:'12px 14px', resize:'none',
                fontFamily:'inherit', outline:'none', width:'100%', boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={onClose} style={{ flex:1, minHeight:52, background:'#1e2435',
                border:'1px solid #334155', borderRadius:14, color:'#94a3b8', fontSize:15, cursor:'pointer' }}>
                Avbryt
              </button>
              <button onClick={handleSend} style={{ flex:2, minHeight:52, background:'#22c55e',
                border:'none', borderRadius:14, color:'#000', fontSize:15, fontWeight:700, cursor:'pointer' }}>
                Skicka feedback
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
