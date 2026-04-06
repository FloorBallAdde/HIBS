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

## Sprint 28 — F: UX-dashboard feedback-trend (2026-04-06)

**Fråga:** Hur visar sportappar in-app hälsostatistik / feedback-trend för admins?

**Källor undersökta:** TeamSnap, Heja, Spond (admin-vy), SUS/UMUX-mätmetoder (Sprint 27 referens)

**Fynd:**
- Ingen av de undersökta sportapparna exponerar UX-hälsodata direkt i tränarens vy.
- TeamSnap och Heja saknar helt in-app feedback-rapportering mot tränaren.
- Sprint 27 valde thumbs-format (snabbare än SUS/UMUX) — Sprint 28 bygger vidare på det.

**UX-beslut:**
- Trend visas som ett kompakt kort ovanför Mer-menyn (inte som ett eget menyalternativ — en tryckning för mycket).
- Procentsats + färgkodad bar (grön ≥70%, gul ≥40%, röd <40%) + emoji-indikator.
- Returnerar null om inga svar finns ännu — stör inte nya användare.
- Scoped till inloggad tränares egna svar (RLS-begränsning från Sprint 27).

**Slutsats:** Enkel, differentierad funktion. Ger Andreas direkt synlighet i appkvalitet utan extra navigering.
