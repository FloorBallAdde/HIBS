/**
 * rinkDraw — rena canvas-ritprimitiver för Taktiktavlan.
 *
 * Inga React-beroenden: varje funktion tar en 2D-context + koordinater och
 * ritar direkt. Extraherad från TaktiktavlaTab.jsx (Sprint 50) så att själva
 * tab-komponenten bara håller state/pointer-logik, inte geometrin.
 *
 * Konsument: TaktiktavlaTab.jsx (initCanvas → drawRink, pointer-handlers → pilar/passlinje).
 */

/* ─────────── Rink ─────────── */
// Ritar en officiell innebandyplan (IFF-standard) med rundade hörn, mittlinje,
// mittcirkel, mållinjer, mål, målområden (D-zon) och tekningspunkter.
export function drawRink(ctx, W, H) {
  const m = 14, rw = W - m * 2, rh = H - m * 2;

  // Rounded-corner rink path (IFF standard: rounded corners, ~7.5% of shorter side)
  const cr = Math.min(rw, rh) * 0.075;
  function rrPath(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h,     x, y + h - r,     r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y,         x + r, y,          r);
    ctx.closePath();
  }

  // Background (boards color)
  ctx.fillStyle = "#1a4a8a";
  ctx.fillRect(0, 0, W, H);

  // Rink surface — rounded
  ctx.fillStyle = "#1e55a0";
  rrPath(m, m, rw, rh, cr);
  ctx.fill();

  // Board outline — rounded, white
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 2.5;
  rrPath(m, m, rw, rh, cr);
  ctx.stroke();

  // Center red line
  ctx.strokeStyle = "rgba(220,40,40,0.88)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W/2, m); ctx.lineTo(W/2, m + rh); ctx.stroke();

  // Center circle + dot
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(W/2, H/2, rw * 0.09, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath(); ctx.arc(W/2, H/2, 3, 0, Math.PI*2); ctx.fill();

  // ── Goal lines (set in from end boards — space behind goal) ──
  // In a 40m rink the goal line is ~2.7m from the end board = 6.75%
  const glInset = rw * 0.068;
  const glL = m + glInset;   // left goal line x
  const glR = m + rw - glInset; // right goal line x

  ctx.strokeStyle = "rgba(220,40,40,0.82)";
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(glL, m); ctx.lineTo(glL, m + rh); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(glR, m); ctx.lineTo(glR, m + rh); ctx.stroke();

  // ── Goals (on goal lines, extending TOWARD the boards = "behind") ──
  // IFF: goal is 160cm wide, ~65cm deep. Proportionally: ~24% of rink height, ~2.2% of rink width
  const goalH = rh * 0.24;
  const goalD = rw * 0.022;
  const goalY = H/2 - goalH/2;

  // Left goal: door faces right (toward center), net extends left (toward board)
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(glL - goalD, goalY, goalD, goalH);
  ctx.strokeStyle = "rgba(255,255,255,0.88)";
  ctx.lineWidth = 2;
  ctx.strokeRect(glL - goalD, goalY, goalD, goalH);

  // Right goal: door faces left (toward center), net extends right (toward board)
  ctx.fillRect(glR, goalY, goalD, goalH);
  ctx.strokeRect(glR, goalY, goalD, goalH);

  // ── Goal crease / D-zone (semicircle in front of goal, toward center) ──
  const creaseR = rh * 0.125;
  ctx.strokeStyle = "rgba(220,40,40,0.50)";
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(glL, H/2, creaseR, -Math.PI/2, Math.PI/2);  ctx.stroke(); // left D
  ctx.beginPath(); ctx.arc(glR, H/2, creaseR,  Math.PI/2, Math.PI*1.5); ctx.stroke(); // right D

  // ── Face-off dots ──
  const fpX = rw * 0.22, fpY = rh * 0.15;
  [[m+fpX,m+fpY],[m+fpX,m+rh-fpY],[m+rw-fpX,m+fpY],[m+rw-fpX,m+rh-fpY]].forEach(([x,y]) => {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
  });
}

/* ─────────── Arrow helpers ─────────── */
// Rak pil med pilhuvud — används för raka löpningar.
export function drawArrow(ctx, x1, y1, x2, y2, color, lw) {
  const dx = x2-x1, dy = y2-y1;
  const len = Math.sqrt(dx*dx+dy*dy);
  if (len < 4) return;
  const angle = Math.atan2(dy, dx);
  const head = Math.max(12, lw * 5);
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
  const stopX = x2 - Math.cos(angle) * head * 0.6;
  const stopY = y2 - Math.sin(angle) * head * 0.6;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(stopX, stopY); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head*Math.cos(angle-Math.PI/6), y2 - head*Math.sin(angle-Math.PI/6));
  ctx.lineTo(x2 - head*Math.cos(angle+Math.PI/6), y2 - head*Math.sin(angle+Math.PI/6));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

/* Curved arrow with explicit control point — used for bidirectional run arrows */
// Modul-intern hjälpare (exporteras ej): ritar en böjd pil via en quadratic curve
// med explicit kontrollpunkt (cx,cy). drawCurvedArrow räknar ut kontrollpunkten.
function drawCurvedArrowCtrl(ctx, x1, y1, x2, y2, cx, cy, color, lw) {
  const dx = x2-x1, dy = y2-y1;
  const len = Math.sqrt(dx*dx+dy*dy);
  if (len < 4) return;
  const tx = x2 - cx, ty = y2 - cy;
  const tLen = Math.sqrt(tx*tx+ty*ty);
  const angle = tLen > 0 ? Math.atan2(ty/tLen, tx/tLen) : Math.atan2(dy, dx);
  const head = Math.max(12, lw * 5);
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
  const t = Math.max(0, 1 - (head * 0.6) / len);
  const shaftEndX = (1-t)*(1-t)*x1 + 2*(1-t)*t*cx + t*t*x2;
  const shaftEndY = (1-t)*(1-t)*y1 + 2*(1-t)*t*cy + t*t*y2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, shaftEndX, shaftEndY); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head*Math.cos(angle-Math.PI/6), y2 - head*Math.sin(angle-Math.PI/6));
  ctx.lineTo(x2 - head*Math.cos(angle+Math.PI/6), y2 - head*Math.sin(angle+Math.PI/6));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

/* Curved arrow — uses actual pointer path to determine curve direction & shape.
   canvasW/canvasH used for smart fallback: curves toward rink center, never toward boards. */
// Böjd löpningspil. Följer användarens faktiska bågrörelse om pathPts finns,
// annars kurvar den smart mot planens centrum (aldrig mot sargen).
export function drawCurvedArrow(ctx, x1, y1, x2, y2, color, lw, pathPts, canvasW, canvasH) {
  const dx = x2-x1, dy = y2-y1;
  const len = Math.sqrt(dx*dx+dy*dy);
  if (len < 4) return;

  let cx, cy;
  if (pathPts && pathPts.length >= 4) {
    // Follow user's actual arc — 40% into the path is the natural control point
    const mid = pathPts[Math.floor(pathPts.length * 0.4)];
    cx = mid.x; cy = mid.y;
  } else {
    // Smart default: curve toward the rink center (never toward the boards)
    const mx = (x1+x2)/2, my = (y1+y2)/2;
    const perpX = -dy/len, perpY = dx/len; // left perpendicular unit vector
    const offset = len * 0.35;
    if (canvasW && canvasH) {
      // Pick whichever perpendicular direction points toward canvas center
      const toCenterX = canvasW/2 - mx, toCenterY = canvasH/2 - my;
      const sign = (perpX * toCenterX + perpY * toCenterY) >= 0 ? 1 : -1;
      cx = mx + perpX * sign * offset;
      cy = my + perpY * sign * offset;
    } else {
      cx = mx + perpX * offset;
      cy = my + perpY * offset;
    }
  }
  drawCurvedArrowCtrl(ctx, x1, y1, x2, y2, cx, cy, color, lw);
}

/* Dashed line for passes — no arrowhead, just dashed stroke */
// Streckad linje för passningar — ingen pilspets, bara dash-stroke.
export function drawDashedLine(ctx, x1, y1, x2, y2, color, lw) {
  const dx = x2-x1, dy = y2-y1;
  const len = Math.sqrt(dx*dx+dy*dy);
  if (len < 4) return;
  const dashLen = Math.max(8, lw * 4), gapLen = Math.max(5, lw * 2.5);
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.lineCap = "round"; ctx.setLineDash([dashLen, gapLen]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.setLineDash([]); // reset
  ctx.restore();
}
