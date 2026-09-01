import { useState, useRef } from "react";

/**
 * Sheet — delad bottom-sheet-wrapper. Sprint 54.
 *
 * DRY:ar overlay+sheet-strukturen som tidigare dupplicerades i varje
 * sheet-modal (fixed overlay med backdrop-onClick→onClose + inre panel
 * med stopPropagation + 20px-rundad topp + slide-up-animation).
 *
 * Bakar dessutom in swipe-ned-för-att-stänga via ett riktigt grabber-
 * handtag högst upp — en-handsdismiss med tummen (rink-värde: kalla
 * händer, glance-bruk). Gesten binds ENBART till grabbern (touchAction:
 * none) så att scroll i sheet-body aldrig krockar med dismiss-gesten.
 *
 * Props:
 *   onClose        — anropas vid backdrop-tryck ELLER swipe-ned > tröskel
 *   children       — sheet-innehåll
 *   background     — panel-bakgrund (default "#161926")
 *   overlayOpacity — svärta på backdrop, 0–1 (default 0.8)
 *   maxWidth       — panel max-bredd, px-tal eller CSS-värde (default 430)
 *   maxHeight      — t.ex. "90vh" → gör body scrollbar (default: ingen)
 *   padding        — panel-padding (default "24px 20px 40px")
 *   zIndex         — overlay z-index (default 200)
 */
const CLOSE_THRESHOLD = 90; // px swipe-ned innan sheet stängs

export default function Sheet({
  onClose,
  children,
  background = "#161926",
  overlayOpacity = 0.8,
  maxWidth = 430,
  maxHeight,
  padding = "24px 20px 40px",
  zIndex = 200,
}) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    setDragging(true);
  };
  const onTouchMove = (e) => {
    const dy = e.touches[0].clientY - startY.current;
    setDragY(dy > 0 ? dy : 0); // följ bara nedåt
  };
  const onTouchEnd = () => {
    setDragging(false);
    if (dragY > CLOSE_THRESHOLD) onClose();
    else setDragY(0); // snäpp tillbaka
  };

  // Transform appliceras bara under/efter drag — annars rör vi inte
  // .hibs-sheet entré-animationen (hibsSlideUp).
  const transform = dragY > 0 ? `translateY(${dragY}px)` : undefined;

  return (
    <div
      onClick={onClose}
      className="hibs-overlay"
      style={{
        position: "fixed", inset: 0, background: `rgba(0,0,0,${overlayOpacity})`,
        zIndex, display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hibs-sheet hibs-sheet--grab"
        style={{
          background,
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px 20px 0 0",
          padding,
          width: "100%",
          maxWidth,
          ...(maxHeight ? { maxHeight, overflowY: "auto" } : null),
          boxSizing: "border-box",
          transform,
          transition: dragging ? "none" : "transform 0.25s cubic-bezier(0.34,1.2,0.64,1)",
        }}
      >
        {/* Grabber — touch-handtag för swipe-ned-stäng (rink: tummen) */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          aria-hidden="true"
          style={{
            touchAction: "none", display: "flex", justifyContent: "center",
            alignItems: "center", height: 26, marginTop: -10, marginBottom: 4,
            cursor: "grab",
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.22)" }} />
        </div>
        {children}
      </div>
    </div>
  );
}
