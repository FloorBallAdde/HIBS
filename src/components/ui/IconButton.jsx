/**
 * IconButton — kodifierat a11y-ikonknapps-mönster.
 *
 * Sprint 50 flaggade att kodifiera som <IconButton> när vi nått en sjunde
 * callsite. Sprint 51 nådde dit (S46 filter-chips, S47 favorite-toggle,
 * S48 ChainCard ✕×2, S49 Återställ-knapp, S50 Rensa-knapp, S51 token-badge).
 * Sprint 52 extraherar mönstret — minimalt, fokuserat på rink-bruk.
 *
 * Tre saker som ALLTID gäller i mönstret:
 *  1. title + aria-label på svenska (skärmläsare + tooltip)
 *  2. minWidth/minHeight ≥ 44 px touch-target (rinken, kalla händer)
 *  3. inline-flex centrering, background:none, border:none — ghost-baseline
 *     som callsiten kan färglägga via `style`-overrides
 *
 * Migrerade callsites (Sprint 52):
 *  - ChainCard.jsx — radera kedja (rad ~58)
 *  - ChainCard.jsx — radera spelare ur kedja (rad ~89)
 *  - ExerciseListItem.jsx — favorite-toggle ★/☆ (rad ~41)
 *  - ExerciseDetailSheet.jsx — favorite-toggle ★/☆ (rad ~65)
 *
 * INTE migrerade (mönstret divergerar för mycket):
 *  - FilterChips (S46): kategori/intensitet-chips har pill-bakgrund + variabel
 *    border-färg per aktivt state — chip-mönster, inte ikon-mönster.
 *  - OvningarTab (S49) "Återställ"-knapp: text-knapp med pill-padding.
 *  - TaktiktavlaTab (S50) "🗑 Rensa": state-beroende styling (confirmClear).
 *  - TokenOverlay (S51) ✕-badge: <div role="button"> + pointerDown + absolute
 *    + 22×22 (compact) eftersom 44×44 skulle överlappa 30×30 player-token.
 *
 * Props:
 *   children       — innehåll (vanligtvis en enda glyph: ✕, ★, ☆, 🎨, …)
 *   label          — sätter både title och aria-label (samma svenska text)
 *   onClick        — klick-handler
 *   ariaPressed    — för toggle-knappar (favorite); utelämna för actions
 *   color          — text/foreground-färg (CSS color)
 *   fontSize       — icon-glyph storlek (default 14)
 *   style          — extra styles som mergas in sist (har sista ordet)
 *   ...rest        — vidarebefordras till <button> (t.ex. type, disabled)
 */
export default function IconButton({
  children,
  label,
  onClick,
  ariaPressed,
  color,
  fontSize = 14,
  style,
  ...rest
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={ariaPressed}
      style={{
        minWidth: 44, minHeight: 44,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "none", border: "none", cursor: "pointer",
        padding: 0, fontFamily: "inherit",
        fontSize, lineHeight: 1,
        color,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
