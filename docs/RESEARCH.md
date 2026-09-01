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

## Sprint 50 — F: Två-stegs-bekräftelse på Rensa-knappen i Taktiktavlan (2026-05-20)

**Fråga:** Hur skyddar man mot oavsiktlig destruktiv åtgärd (rensa hela tavlan) i en mobil tränarapp utan att lägga på onödig friktion?

**Källor undersökta:** UX Movement (destructive actions), UX Psychology / UX Planet (confirmation dialogs), DesignMonks (delete button UI), Indie Hackers UX-tips.

**Fynd:**
- För **reversibla** lågrisk-åtgärder är ångra (undo) bättre än en bekräftelse-dialog. För **irreversibla** åtgärder är ett medvetet bekräftelse-steg att föredra.
- Bekräftelse-dialoger tappar effekt om de visas ofta — de blir "bakgrundsbrus". Använd sparsamt och bara för verkligt destruktiva åtgärder.
- Rött är ett starkt visuellt varningstecken; destruktiva knappar bör inte ha neutral färg.
- Friktionsmekanismer (t.ex. tvinga ett extra medvetet steg + papperskorgs-ikon som förstärker "radera") gör åtgärden deliberat utan tung modal.

**Insikt om appen:** `clear()` kör `snap()` så själva canvasen kan ångras — MEN `setTokens([])` är inte ångringsbart. Utplacerade spelare/koner/boll försvinner permanent vid ett feltryck. Det är den verkliga risken vid rinken med kalla händer.

**Mini Design Phase:**
- **A — Två-stegs inline-bekräftelse** på 🗑-knappen: första tryck väpnar (knappen blir röd, "🗑 Säker?"), andra tryck inom 3s rensar, auto-avväpning efter 3s.
- **B — Bekräftelse-modal** ("Rensa hela tavlan? Ja/Avbryt"): säkrast men tyngst — kräver läsa + två tryck, mer friktion vid rinken.
- **C — Gör clear ångringsbart** (snapshotta tokens): "magiskt" men osynligt — tränaren vet inte att det går att ångra, paniken vid rinken kvarstår, och det ändrar undo-stackens semantik (risk).

**Val:** A. Matchar rink-kontexten (snabbt, glance-baserat, kalla händer), inga nya beroenden, additivt, scoped till samma fil som refaktoreringen, ingen schemamigration. Det väpnade läget är starkt synligt (röd + "Säker?") och adresserar feltrycks-problemet direkt.

**Slutsats:** Lättviktig friktion på exakt rätt ställe — skyddar den enda icke-ångringsbara åtgärden i Taktiktavlan utan att sakta ner det vanliga flödet (en penna/pil-tryck väpnar inget).

## Sprint 56 — F: Närvarodata till Supabase, cross-device sync (2026-06-10)

**Fråga:** Hur migrerar man P12-närvarodatan (localStorage `hibs_att`) till Supabase så flera tränare ser samma närvaro — utan att ändra konsument-API:t i PlaneraTab/StatsContent?

**Konkurrensbild:** TeamSnap och Heja har båda delad närvaro som kärnfunktion (alla ledare ser samma avbockningar i realtid) — localStorage-only var en känd MVP-begränsning sedan Sprint 23.

**Mini Design Phase:**
- **A — En rad per session med jsonb-array av namn:** minimal kodändring, en upsert per toggle. Brister i exakt rink-scenariot: två tränare som bockar av samtidigt skriver över varandras HELA lista (last-write-wins på arrayen).
- **B — En rad per (session, spelare):** toggle = insert/delete av en rad. Två tränare kan bocka av olika spelare samtidigt utan konflikt; unique-constraint stoppar dubbletter; mappar rent på befintliga sbPost/sbDel.
- **C — localStorage + bakgrundssync:** offline-first merge-logik — overkill och riskabel komplexitet.

**Val:** B — konfliktfri vid samtidig avbockning, enklast korrekt semantik.

**SQL-migration (Andreas kör manuellt i Supabase SQL editor):**

```sql
-- Sprint 56: Delad närvaro — en rad per (session, spelare)
CREATE TABLE IF NOT EXISTS training_attendance (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid NOT NULL,
  session_id  uuid NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_name)
);

CREATE INDEX IF NOT EXISTS training_attendance_club_idx ON training_attendance (club_id);

ALTER TABLE training_attendance ENABLE ROW LEVEL SECURITY;

-- ⚠️ Spegla RLS-mönstret från training_sessions. Om policies där bygger på
-- profiles.club_id ser de ut så här:
CREATE POLICY "attendance_select" ON training_attendance FOR SELECT
  USING (club_id IN (SELECT club_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "attendance_insert" ON training_attendance FOR INSERT
  WITH CHECK (club_id IN (SELECT club_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "attendance_delete" ON training_attendance FOR DELETE
  USING (club_id IN (SELECT club_id FROM profiles WHERE id = auth.uid()));
```

**Klient-design (`src/hooks/useAttendance.js`):**
- State = råa rader; `attendance`-map deriveras via useMemo → PlaneraTab/StatsContent oförändrade.
- Optimistisk toggle med rollback om sbPost inte returnerar en rad (RLS/nätverksfel) eller sbDel kastar.
- 60s-polling (samma mönster som loadData/observationer i App.jsx) så co-tränarens avbockningar dyker upp.
- Engångsmigrering: legacy `hibs_att` pushas per-session mot TOM tabell; bara uuid-session-id:n (Date.now()-fallback-id:n pekar inte på riktiga sessioner); flagga `hibs_att_migrated` per enhet. Gamla `hibs_att`-nyckeln lämnas kvar som passiv backup.

**Slutsats:** Delad närvaro utan API-ändring för konsumenterna; relationell modell gör samtidiga avbockningar konfliktfria. Appen är graceful före migrationen (sbGet ger error-objekt → ej array → tom närvaro, inga kraschar), men toggles sparas inte förrän tabellen finns.

## Sprint 57 — T: Konsolidera polling + utvärdering av Supabase Realtime (2026-06-12)

**Fråga:** Tre separata setInterval-loopar (loadData 60s, useAttendance 60s, useLiveMatchPoll 10s) — gemensam refetch-mekanism eller Supabase Realtime?

**Utvärdering Supabase Realtime:** Kräver supabase-js-klienten (WebSocket-baserade channels). Appen använder medvetet raw fetch (`src/lib/supabase.js`, ~0 kB deps, AbortController-timeout). Att dra in supabase-js (~25 kB gzip) + Realtime-publikationer + reconnect-hantering för 3 tabeller är fel trade-off för ett lag med 2–3 tränare — pollingvolymen är trivial. **Avvisad tills vidare.** Omprövas om appen får många klubbar eller realtidskrav <10s.

**Val: gemensam `usePoll`-hook** (Page Visibility API):
- Pausar ticks när `document.hidden` — telefon i fickan/låst vid rinken = 0 requests → batterisnålare (störst vinst: 10s-loopen).
- Hoppar över ticks när `navigator.onLine === false`.
- Omedelbar refetch på `visibilitychange`→synlig och `online`-event — färsk data direkt när telefonen tas upp.
- Callback i ref → intervallet startas aldrig om när callback-identiteten byter.

**Kvar utanför scope (loggat i backlog):** ParentView.jsx + TeamMessages.jsx har egna 30s-loopar; useAuth 50min-refresh ska INTE pausas vid dold flik (token får inte gå ut) — lämnas medvetet.


## Sprint 67 — F: P2 Trend per spelare (2026-07-20)

**Konkurrentkoll (TeamSnap, GameChanger):**
- TeamSnap: spelarstatistik ligger bakom Premium/Ultra — enkla säsongstotaler, ingen trendvisualisering per spelare.
- GameChanger: djupast i klassen (150+ stats, spray charts, "season-level at a glance"-vyer som Defensive Innings) — men allt bor i separata spelarprofiler, flera tryck bort.
- Slutsats för HIBS: ingen av dem visar trend DÄR tränaren redan tittar. Vår vinkel: inline-sparkline i befintlig leaderboard — ett tryck, noll navigation, glance-läsbar vid rinken.

**Designval:** stapel-sparkline (poäng/match, senaste 10) i expanderbar rad, färgkodad amber/blå/dov (mål/assist/spelade utan poäng). Linjediagram för topp-5 förkastat (oläsbart på 390px mörk skärm); fullskärms-sheet förkastat (duplicerar Mer→Spelare).

Källor: teamsnap.com, gc.com/youth-sports-app (App Store/Google Play-beskrivningar).
