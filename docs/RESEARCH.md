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

## Sprint 40 — F: has_drawing listindikator (2026-04-28)

**Fråga:** Hur visar man "har bilaga/ritning" i en lista utan att ladda full mediadata?

**Mönster (egen praxis + standard-UX):**
- Apple Notes / Bear / Notion: liten ikon till höger om titeln markerar att noten har bilaga, inte själva bilagan.
- Trello: paperclip-ikon på kort visar att en attachment finns, men laddas in lazy.
- Slutsats: en boolean-kolumn kostar ~1 byte per rad och eliminerar 100–500 KB base64-payload per övning vid listladdning.

**SQL-migration (Andreas kör manuellt i Supabase SQL editor):**

```sql
-- Sprint 40: Lägg till has_drawing flag som spegling av canvas_drawing IS NOT NULL
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS has_drawing boolean NOT NULL DEFAULT false;

-- Backfill: existerande rader med ritning får has_drawing = true
UPDATE exercises SET has_drawing = true WHERE canvas_drawing IS NOT NULL;
```

Inga ytterligare RLS-policies krävs — has_drawing ärver SELECT/UPDATE från befintlig exercises-policy.

**Klient-syncing:**
- `OvningarTab.handleSaveDrawing` skriver både `canvas_drawing` och `has_drawing: true` i samma sbPatch så listindikatorn uppdateras direkt utan reload.
- Nya övningar (CreateExerciseForm) sätter inte has_drawing → DB-default false → ingen ikon förrän ritning sparas.
- Listan filtrerar inte ut övningar utan has_drawing — den visar bara 🎨 där det är true (graceful om kolumn saknas: `ex.has_drawing` blir undefined → ingen ikon).

**UX-beslut:**
- 🎨-emoji ovanför ★/☆-knappen i top-right-kolumnen (Approach A).
- Liten storlek (fontSize 13, opacity 0.85) för att inte konkurrera med intensitetsfärgen ovanför.
- title + aria-label på svenska — accessibility utan extra UI-yta.

**Slutsats:** Enkel migration, mätbar prestanda-vinst (Sprint 37:s lazy-load + Sprint 40:s indikator) utan att offra glance-information.
