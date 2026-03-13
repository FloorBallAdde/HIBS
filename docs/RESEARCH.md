# HIBS Tränarapp — Research Log

## Sprint 7 — F6: 3 lagmål per match (2026-03-13)

**Fråga:** Hur hanterar konkurrerande appar pre-match team goals / intentions?

**Källor undersökta:** TeamSnap, Heja, Spond, SportsPlus

**Fynd:**
- Ingen av de undersökta apparna (TeamSnap, Heja, Spond) har en explicit "pre-match team goals" funktion.
- TeamSnap fokuserar på schemaläggning, betalning och tillgänglighet.
- Heja fokuserar på kommunikation och närvaro.
- Match-intentions (lagmål per match) är en differentierad funktion unikt för HIBS-appen.

**UX-beslut:**
- Lagmål sätts i trupp-steget (före matchstart) — naturligt flöde, Andreas kan ta det med laget.
- 3 fritext-fält (valfritt) med placeholder "t.ex. Pressa högt".
- Visas kompakt under live-match som green chips — påminner utan att distrahera.
- Sparas med match-posten i Supabase för historik.
- 0-3 mål (tomma fält filtreras bort vid startMatch).

**Slutsats:** HIBS implementerar något konkurrenterna saknar. Enkelt men distinkt.
