import { useRef, useCallback } from "react";

/**
 * useTouchSwap — touch-baserad drag-and-drop swap.
 * Fungerar på iOS och Android (HTML5 drag events stöds ej på mobil).
 *
 * Användning:
 *   const swap = useTouchSwap({ onSwap: (src, dst) => doSwap(src, dst) });
 *
 * På draggable element:
 *   onTouchStart={e => swap.onTouchStart(e, srcData, "Spelarnamn")}
 *   onTouchMove={swap.onTouchMove}
 *   onTouchEnd={swap.onTouchEnd}
 *   style={{ touchAction: "none", userSelect: "none" }}
 *
 * På drop-targets (inkl. draggable element):
 *   data-swap-slot={JSON.stringify(dstData)}
 */
export function useTouchSwap({ onSwap }) {
  const ghostRef = useRef(null);
  const srcRef   = useRef(null);
  const hoverRef = useRef(null);

  const cleanup = () => {
    if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null; }
    if (hoverRef.current) { hoverRef.current.style.outline = ""; hoverRef.current = null; }
    srcRef.current = null;
  };

  // Göm ghost tillfälligt för att kunna läsa elementet under fingret
  const findSlotUnder = (x, y) => {
    const g = ghostRef.current;
    if (g) g.style.display = "none";
    const el = document.elementFromPoint(x, y);
    if (g) g.style.display = "";
    return el?.closest("[data-swap-slot]") ?? null;
  };

  const onTouchStart = useCallback((e, srcData, playerName) => {
    // Om touch sker på en knapp (t.ex. × ta-bort) — starta inte drag
    if (e.target.closest("button")) return;
    e.preventDefault(); // förhindra scroll under drag
    const touch = e.touches[0];

    const el = document.createElement("div");
    el.textContent = "⠿ " + playerName;
    el.style.cssText = [
      "position:fixed",
      "z-index:9999",
      "pointer-events:none",
      "background:linear-gradient(135deg,#a78bfa,#7c3aed)",
      "border-radius:99px",
      "padding:8px 20px",
      "color:#fff",
      "font-weight:800",
      "font-size:14px",
      "font-family:system-ui,sans-serif",
      "transform:translate(-50%,-50%)",
      "box-shadow:0 8px 32px rgba(0,0,0,0.55)",
      "white-space:nowrap",
      "opacity:0.96",
      "transition:opacity 0.1s",
    ].join(";");
    el.style.left = touch.clientX + "px";
    el.style.top  = touch.clientY + "px";
    document.body.appendChild(el);

    ghostRef.current = el;
    srcRef.current   = srcData;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!ghostRef.current) return;
    const touch = e.touches[0];
    ghostRef.current.style.left = touch.clientX + "px";
    ghostRef.current.style.top  = touch.clientY + "px";

    const target = findSlotUnder(touch.clientX, touch.clientY);
    if (hoverRef.current !== target) {
      if (hoverRef.current) hoverRef.current.style.outline = "";
      if (target) target.style.outline = "2px solid #a78bfa";
      hoverRef.current = target;
    }
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!srcRef.current) { cleanup(); return; }
    const touch  = e.changedTouches[0];
    const target = findSlotUnder(touch.clientX, touch.clientY);

    if (target && target.dataset.swapSlot) {
      try {
        const dst = JSON.parse(target.dataset.swapSlot);
        onSwap(srcRef.current, dst);
      } catch (_) {}
    }
    cleanup();
  }, [onSwap]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
