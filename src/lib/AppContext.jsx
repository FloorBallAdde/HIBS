import { createContext, useContext } from "react";

/**
 * AppContext — delad app-state utan prop-drilling (Sprint 72).
 * Tillhandahåller det som nästan varje vy behöver: auth-token, klubb,
 * inloggad tränare, spelarlistan och updP-hjälparen.
 *
 * Användning:  const { clubId, uid, tok, profile, players, updP } = useApp();
 *
 * Regel: nya komponenter läser härifrån i stället för att ta emot
 * clubId/tok/uid/profile/players som props. Befintliga migreras gradvis.
 */
export const AppCtx = createContext(null);

export const useApp = () => {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp måste användas under <AppCtx.Provider>");
  return ctx;
};
