# HIBS — Nuvarande arkitektur & refaktoreringsplan

*Senast uppdaterad: 2026-09-02 (Sprint 77 klar)*

---

## Nuvarande struktur (före refaktorering)

```
hibs-app/
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml
└── src/
    └── App.jsx          ← 1 566 rader — ALLT i en fil
```

### Komponenter i App.jsx (nuvarande)

| Rad | Komponent | Beskrivning | Storlek |
|-----|-----------|-------------|---------|
| 5 | StableInput | Återanvändbar input som behåller fokus | ~22 rad |
| 29–44 | Supabase-funktioner | hdrs, sbAuth, sbGet, sbPost, sbPatch, sbDel | ~16 rad |
| 39–44 | localStorage-wrapper | ls.get, ls.set, ls.clear | ~6 rad |
| 46–110 | Konstanter | TODAY, FMT, färger, grupper, default-spelare, checklist, roadmap | ~65 rad |
| 145–309 | AuthScreen | Login/register/klubb-val | ~165 rad |
| 312–327 | NoteModal | Anteckningsmodal för spelare | ~16 rad |
| 329–360 | GoalModal | Individuella mål-modal | ~32 rad |
| 363–419 | MatchCard | Expanderbart matchkort | ~57 rad |
| 421–497 | FormationCard | Linje-kort med positioner | ~77 rad |
| 499–515 | KedjorTab | Kedjehantering | ~17 rad |
| 516–592 | ScrambleMode | Scrambla kedjor | ~77 rad |
| 594–660 | GrupperMode | Grupphantering | ~67 rad |
| 661–717 | BlandaMode | Blanda grupper | ~57 rad |
| 718–839 | PlaneraTab | Träningsplanering | ~122 rad |
| 840–931 | OvningarTab | Övningsbibliotek | ~92 rad |
| 935–1566 | App (main) | Huvudkomponent med alla tabs | ~631 rad |

---

## Målarkitektur (efter refaktorering)

```
hibs-app/
├── .env                          ← Supabase-nycklar (EJ i Git)
├── .env.example                  ← Mall utan riktiga nycklar
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml
├── docs/
│   ├── ROADMAP.md
│   └── ARCHITECTURE.md
└── src/
    ├── App.jsx                   ← ~100 rad — bara routing/layout
    ├── lib/
    │   ├── supabase.js           ← Supabase-klient & helpers
    │   ├── storage.js            ← localStorage-wrapper
    │   └── constants.js          ← Alla konstanter
    ├── hooks/
    │   ├── useAuth.js            ← Auth-logik
    │   ├── useMatchSession.js    ← Match-session state
    │   ├── useTouchSwap.js       ← Touch drag-and-drop (Sprint 5)
    │   ├── useSeasonStats.js     ← Säsongsstatistik (Sprint 8)
    │   └── useData.js            ← Data-laddning (spelare, matcher, etc.)
    ├── components/
    │   ├── ui/
    │   │   ├── StableInput.jsx
    │   │   ├── BottomNav.jsx       ← Sprint 7
    │   │   ├── ProfilePanel.jsx    ← Sprint 12: profilpanel
    │   │   ├── Modal.jsx
    │   │   └── Button.jsx
    │   ├── auth/
    │   │   ├── AuthScreen.jsx        ← Sprint 64: nedbruten (login/register + invite-flöde)
    │   │   ├── ClubSetup.jsx         ← Sprint 64: choose/create/join-klubb extraherad
    │   │   └── authUi.jsx            ← Sprint 64: delad inpStyle + AuthButton
    │   ├── players/
    │   │   ├── PlayerList.jsx
    │   │   ├── NoteModal.jsx
    │   │   └── GoalModal.jsx
    │   ├── match/
    │   │   ├── MatchContent.jsx      ← Sprint 2
    │   │   ├── MatchNoteModal.jsx    ← Sprint 6: extraherad från App.jsx
    │   │   ├── LiveMatchView.jsx     ← Sprint 9: live-match-vy
    │   │   ├── SubstitutionPanel.jsx ← Sprint 58: spelarbyten (utbruten ur LiveMatchView)
    │   │   ├── MatchShotStats.jsx    ← Sprint 59: skottstatistik (utbruten ur LiveMatchView)
    │   │   ├── MatchSquadSection.jsx ← Sprint 16: trupp-val
    │   │   ├── FormationCard.jsx
    │   │   └── MatchCard.jsx
    │   ├── training/
    │   │   ├── KedjorTab.jsx
    │   │   ├── ScrambleMode.jsx
    │   │   ├── GrupperMode.jsx
    │   │   ├── PlayerPool.jsx          ← Sprint 47: extraherad från GrupperMode
    │   │   ├── ChainCard.jsx           ← Sprint 48: extraherad från GrupperMode
    │   │   ├── BlandaMode.jsx
    │   │   ├── PlaneraTab.jsx
    │   │   ├── OvningarTab.jsx
    │   │   ├── FilterChips.jsx        ← Sprint 46: extraherad från OvningarTab
    │   │   ├── DrawingOverlay.jsx     ← Sprint 44: extraherad från OvningarTab
    │   │   ├── CreateExerciseForm.jsx
    │   │   ├── ExerciseDetailSheet.jsx ← Sprint 33: extraherad från OvningarTab
    │   │   └── TaktiktavlaTab.jsx      ← Sprint 12: canvas-ritverktyg
    │   ├── season/
    │   │   ├── Checklist.jsx
    │   │   └── Roadmap.jsx
    │   ├── mer/
    │   │   ├── MerContent.jsx      ← Sprint 3: extraherad mer-vy
    │   │   ├── GrupperDnD.jsx      ← Sprint 28: DnD-grupperingsvy
    │   │   ├── FeedbackTrend.jsx   ← Sprint 28: UX-trend-kort
    │   │   ├── TeamMessages.jsx    ← Sprint 26: lagmeddelanden (P11 Fas 1)
    │   │   └── MessageComposer.jsx ← Sprint 66: composer extraherad ur TeamMessages
    │   └── home/
    │       ├── HomeContent.jsx     ← Sprint 1: extraherad hem-vy
    │       ├── UpcomingMatchCard.jsx ← Sprint 15: kommande matcher
    │       ├── MatchRsvpModal.jsx  ← Sprint 11: RSVP-modal
    │       ├── ParentView.jsx     ← Sprint 33: förenklad föräldravy (P11 Fas 2)
    │       ├── SeasonRecordHero.jsx ← Sprint 38: hero med säsongsrekord
    │       ├── LatestMatchCard.jsx ← Sprint 39: senaste match-kort
    │       ├── QuickStatsStrip.jsx ← Sprint 40: 4 mini-stat-kort
    │       └── FormStrip.jsx ← Sprint 41: form senaste 5 + målskillnad-indikator
    ├── match/
    │   ├── MatchContent.jsx      ← Sprint 2: extraherat match-flöde
    │   ├── MatchCard.jsx
    │   └── FormationCard.jsx
    └── styles/                   ← (framtida: CSS-moduler)
```

---

## Refaktoreringsordning

1. **Skapa .env + lib/supabase.js** — flytta nycklar, skapa klient
2. **Extrahera lib/constants.js + lib/storage.js** — enkla copy-paste
3. **Extrahera auth/AuthScreen.jsx** — självständig, inga beroenden
4. **Extrahera modals** — NoteModal, GoalModal
5. **Extrahera match-komponenter** — MatchCard, FormationCard
6. **Extrahera training-komponenter** — ett i taget
7. **Extrahera hooks** — useAuth, useMatchSession, useData
8. **Rensa App.jsx** — bara routing och layout kvar

*Varje steg: implementera → testa lokalt → commita*

---

## Fas 0 — Sprintlogg

| Sprint | Datum | Beskrivning | App.jsx rader | Status |
|--------|-------|-------------|---------------|--------|
| 1 | 2026-03-10 | Extrahera HomeContent → src/components/home/HomeContent.jsx | 648 → 561 | ✅ Klar |
| 2 | 2026-03-11 | Extrahera MatchContent + F1: Målvakter exkluderas från scramble | 561 → 430 | ✅ Klar |
| 3 | 2026-03-11 | Extrahera MerContent + F2: Hårda positionsregler i ScrambleMode | 430 → 312 | ✅ Klar |
| 4 | 2026-03-13 | useMatchSession hook + P1: Lagets form & senaste träning i Hem | 312 → 248 | ✅ Klar |
| 5 | 2026-03-13 | useTouchSwap hook + touch drag-and-drop i kedjor och match | 248 → 248 | ✅ Klar |
| 6 | 2026-03-13 | MatchNoteModal extraherad + F9: Soft guard ingen kedjor vid matchstart | 248 → 238 | ✅ Klar |
| 7 | 2026-03-13 | BottomNav extraherad + F6: 3 lagmål per match | 238 → 232 | ✅ Klar |
| 8 | 2026-03-14 | useSeasonStats hook extraherad + F4: Favoritsystem i Övningsbibliotek | 232 → 217 | ✅ Klar |
| 9 | 2026-03-14 | Matchschema (upcomingMatches) + AI-genererade matchtexter (Netlify fn + Claude API) | 217 → 210 | ✅ Klar |
| 10 | 2026-03-15 | GoalModal (individuella mål, F7) + useSeasonStats-fix | 210 → 210 | ✅ Klar |
| 11 | 2026-03-16 | MatchRsvpModal extraherad + RSVP-flöde i HomeContent | 210 → 210 | ✅ Klar |
| 12 | 2026-03-16 | ProfilePanel extraherad + TaktiktavlaTab (canvas-ritverktyg) | 210 → 210 | ✅ Klar |
| 13 | 2026-03-16 | Kallelser (updateUpcomingRsvp hook) + HomeContent RSVP-integration | 210 → 210 | ✅ Klar |
| 14 | 2026-03-16 | UI/UX polish: global CSS animationer + FONT-skala + button press-states | 210 → 210 | ✅ Klar |
| 15 | 2026-03-18 | UpcomingMatchCard extraherad + kontrast #64748b + FONT-tokens i MatchContent | 210 → 210 | ✅ Klar |
| 16 | 2026-03-20 | MatchSquadSection extraherad + Spelarbyten (substitutions) i LiveMatchView | 210 → 210 | ✅ Klar |
| 17 | 2026-03-20 | Visa byten i matchhistorik + duplikatlista-städning | 210 → 210 | ✅ Klar |
| 18 | 2026-03-21 | Match-sparande bugg + Grupper→Kedjor DnD + Blanda tre lägen | 210 → 210 | ✅ Klar |
| 19 | 2026-03-22 | Disabled-färg #475569 + ARCHITECTURE.md uppdaterad + Interaktiva lagmål live | 210 → 210 | ✅ Klar |
| 20 | 2026-03-24 | #334155→#475569 i HomeContent/StatsContent/GoalModal/PlaneraTab/MerContent + 📤 Spara/Dela (Share API) i TaktiktavlaTab | 210 → 210 | ✅ Klar |
| 21 | 2026-03-24 | AbortController 10s-timeout i sbGet + lagmål sparas vid matchslut + ✓/○ chips i matchhistorik | 210 → 210 | ✅ Klar |
| 22–27 | 2026-03-26 – 2026-04-05 | AbortController sbPatch/sbPost/sbDel · AppHeader · ObservationModal · P12 närvaro-hook · TeamMessages · PostMatchFeedback (app_feedback-tabell + RLS) | 210 → 259 | ✅ Klar |
| 28 | 2026-04-06 | GrupperDnD+PlayerChip extraherade från MerContent.jsx → src/components/mer/GrupperDnD.jsx · FeedbackTrend: UX-trend-kort i Mer-fliken (app_feedback-data) | 259 → 259 | ✅ Klar |
| 29–32 | 2026-04-08 – 2026-04-12 | AbortController sbAuth/sbRefresh · F3 canvas_drawing-thumbnail + numrerade HUR-steg i OvningarTab · Diverse auto-detected backlog-items | 259 → 261 | ✅ Klar |
| 33 | 2026-04-14 | ExerciseDetailSheet extraherad från OvningarTab · P11 Fas 2 Steg 1: ParentView (föräldra-läsvy) + roll-routing i App.jsx · ARCHITECTURE.md uppdaterad med saknade komponenter | 261 → 262 | ✅ Klar |
| 34–37 | 2026-04-16 – 2026-04-22 | P11 Fas 2 Steg 2 (ParentInvite) · Mer-extraktioner (PlayerListView, ChecklistView, SeasonPlanView, MatchHistoryView) · Lazy-load canvas_drawing | 262 → 266 | ✅ Klar |
| 38 | 2026-04-24 | SeasonRecordHero extraherad från HomeContent.jsx (287→228 rader) · FeedbackTrend: per-tränare-uppdelning (expanderbar) när ≥2 tränare har loggat | 266 → 267 | ✅ Klar |
| 39 | 2026-04-26 | LatestMatchCard extraherad från HomeContent.jsx (228→180 rader) · Förbättrad invite-UX: parent-specifik check_email-vy med 3-stegs-lista och pink theme när invite-länk är aktiv | 263 → 263 | ✅ Klar |
| 40 | 2026-04-28 | QuickStatsStrip extraherad från HomeContent.jsx (180→174 rader) · F: has_drawing boolean — listindikator (🎨) i OvningarTab visar vilka övningar som har taktiktavla-ritning utan att ladda full canvas-data (kräver SQL-migration, se docs/RESEARCH.md) | 263 → 263 | ✅ Klar |
| 41 | 2026-04-30 | FormStrip extraherad från HomeContent.jsx (174→153 rader) · F: Målskillnad-indikator (±N) i FormStrip-headern — aggregerad goal differential över de 5 visade matcherna, färgkodad grön/röd/grå, glance-vänligt vid rinken | 263 → 263 | ✅ Klar |
| 42 | 2026-05-02 | TopScorers extraherad från HomeContent.jsx (152→134 rader) · F: Koncentrationsindikator "TOPP 3: X% AV MÅLEN" i TopScorers-headern — andel av lagets mål från topp 3, glance-värde för bidragsbas vs riskkoncentration | 263 → 263 | ✅ Klar |
| 43 | 2026-05-04 | LatestTrainings extraherad från HomeContent.jsx (134→96 rader) · F: Snitt-tid-indikator "SNITT X MIN" i LatestTrainings-headern — snittminuter över senaste pass, lila #a78bfa matchar per-rad-färgen, kodifierar header-mönstret från S41–42 | 263 → 263 | ✅ Klar |
| 44 | 2026-05-06 | DrawingOverlay extraherad från OvningarTab.jsx (246→235 rader) → src/components/training/DrawingOverlay.jsx · F: Contextual metadata-rad i overlay-headern visar kategori-badge + intensitet (auto-fallback) | 263 → 263 | ✅ Klar |
| 45 | 2026-05-08 | INTENSITY_COLOR-helper i constants.js (DRY: 4 callsites — OvningarTab list/filter, ExerciseDetailSheet, DrawingOverlay, CreateExerciseForm) · F: Semantisk färg på aktiva intensitet-filterknappar i OvningarTab (Låg=grön, Medel=gul, Hög=röd) — glance-värde vid rinken (auto-fallback) | 263 → 263 | ✅ Klar |
| 46 | 2026-05-11 | FilterChips extraherad från OvningarTab.jsx (246→187 rader) → src/components/training/FilterChips.jsx (sök + kategori-chips + kategori-desc + intensitet-filter) · F: Touch-targets höjda till ≥44px på alla filter-chips (kategori-rad + intensitet-rad) för rink-bruk med kalla händer — a11y-attribut även på kategori-knapparna (auto-fallback) | 263 → 263 | ✅ Klar |
| 47 | 2026-05-12 | PlayerPool extraherad från GrupperMode.jsx (307→269 rader) → src/components/training/PlayerPool.jsx (TILLGÄNGLIGA SPELARE-pool med touch-swap + kedjepicker) · F: Favorite-toggle (★/☆) i OvningarTab listrad + ExerciseDetailSheet höjd till ≥44px touch-target + a11y-attribut (title/aria-label/aria-pressed) — paritet med filter-chips från S46 (auto-fallback) | 263 → 263 | ✅ Klar |
| 48 | 2026-05-14 | ChainCard extraherad från GrupperMode.jsx (269→212 rader) → src/components/training/ChainCard.jsx (kedja-header med rename + slots-lista med positioner + drop-zon) · F: Båda ✕-knapparna (radera kedja / ta bort spelare ur kedjan) höjda till ≥44×44 touch-target + aria-label/title — paritet med S46/S47-mönstret (auto-fallback, 14:e sprintet utan ✅ Approved feature) | 263 → 263 | ✅ Klar |
| 49 | 2026-05-18 | ExerciseListItem extraherad från OvningarTab.jsx (33 inline-rader → 53-rad presentations-komponent) → src/components/training/ExerciseListItem.jsx (CAT_COLOR/intensityColor co-located) · F: Empty-state när filter ger 0 träffar i OvningarTab — 🔍-glyph + aktiva filter-summering + Återställ-knapp (≥44px, aria-live=polite) (auto-fallback, 15:e sprintet utan ✅ Approved feature) | 263 → 263 | ✅ Klar |
| 50 | 2026-05-20 | rinkDraw.js (197 rader) extraherad från TaktiktavlaTab.jsx → src/components/training/rinkDraw.js — rena canvas-ritprimitiver (drawRink/drawArrow/drawCurvedArrow/drawDashedLine); TaktiktavlaTab 710→562 rader · F: Två-stegs-bekräftelse på 🗑 Rensa-knappen i Taktiktavlan — första tryck väpnar ("🗑 Säker?", röd), andra inom 3s rensar, auto-avväpning. Skyddar mot feltryck vid rinken eftersom utplacerade tokens (spelare/koner/boll) ej går att ångra (auto-fallback, 16:e sprintet utan ✅ Approved feature) | 263 → 263 | ✅ Klar |
| 51 | 2026-05-26 | TokenOverlay extraherad från TaktiktavlaTab.jsx (562→485 rader) → src/components/training/TokenOverlay.jsx — interaktiva spelare/kon/boll-tokens med drag-handlers och radera-badge · F: ✕-radera-badge på tokens i select-läge förstorad från 18×18 → 22×22 (~50 % större träffyta) + role/aria-label/title — INTE 44×44 hit-area eftersom det skulle överlappa 30×30 player-token och äta drag-tryck (auto-fallback, 17:e sprintet utan ✅ Approved feature) | 263 → 264 | ✅ Klar |
| 52 | 2026-05-28 | IconButton-mönstret kodifierat → src/components/ui/IconButton.jsx (69 rader) — minimalt a11y-mönster (label, color, fontSize, ariaPressed) med 44×44 baseline · 4 callsites migrerade: ChainCard ✕ radera-kedja, ChainCard ✕ radera-spelare, ExerciseListItem favorite-toggle ★/☆, ExerciseDetailSheet favorite-toggle ★/☆ · F: Synlig keyboard-fokus-ring på alla buttons (`button:focus-visible`) i src/index.css — rinken-säkert via `:focus-visible` (mus/touch ger ingen ring), `:not(:focus-visible)`-guard skyddar legacy-browsers, paritet med befintliga input:focus-ring (auto-fallback, 18:e sprintet utan ✅ Approved feature) | 264 → 264 | ✅ Klar |
| 53 | 2026-06-02 | IconButton-migration: 5 modal-header-stäng-knappar (✕/×) → `<IconButton label="Stäng">` i ProfilePanel, ClubProfileModal, MatchRsvpModal, GoalModal, CreateExerciseForm — träffytan höjd från ~30px till 44×44 (rink, kalla händer) + svensk aria-label/title. Standardiserar modal-stängning, utökar IconButton-callsiter från 4 → 9 · F: Drag-handle/grabber på alla bottom-sheets via `.hibs-sheet::before` i src/index.css — rundad pill högst upp som signalerar dismissbarhet (alla sheets stängs redan via bakgrundstryck), `pointer-events:none` (blockerar aldrig tryck), 0 JS, lyfter alla 9 sheets samtidigt (auto-fallback, 19:e sprintet utan ✅ Approved feature) | 264 → 264 | ✅ Klar |
| 54 | 2026-06-04 | Delad `<Sheet>`-wrapper skapad → src/components/ui/Sheet.jsx — DRY:ar overlay+sheet-strukturen (fixed backdrop-onClick→onClose + inre hibs-sheet-panel + stopPropagation + slide-up). 4 sheets migrerade: NoteModal, MatchNoteModal, ObservationModal, GoalModal (per-sheet-varianter bevarade via props: overlayOpacity/background/maxWidth/maxHeight/padding). T-wrapper-item → 🔄 In Progress (4/9), follow-up för resterande 5 loggad · F: Swipe-ned-för-att-stänga via riktigt grabber-handtag i wrappern — touch-drag följer sheeten (translateY), släpp >90px stänger, annars snäpp tillbaka; touchAction:none på enbart grabbern → ingen scroll-konflikt i body; backdrop+✕ oförändrade. `.hibs-sheet--grab::before{display:none}` tar bort dubbel-pill (auto-fallback, 20:e sprintet utan ✅ Approved feature) | 264 → 264 | ✅ Klar |
| 55 | 2026-06-08 | 4 sheets migrerade till `<Sheet>`-wrappern: ProfilePanel, ClubProfileModal, MatchRsvpModal, ExerciseDetailSheet — swipe-ned-stäng nu konsekvent på 8/9 sheets, ~10 rader overlay+sheet-boilerplate borta per callsite. CreateExerciseForm medvetet exkluderad (sticky-header + inre scroll-layout, och avsiktligt ingen backdrop-/swipe-dismiss för att skydda osparad formdata). Wrapper-item + migrerings-item → ✔️ Done · F: "Markera alla"-knapp i MatchRsvpModal — markerar/avmarkerar hela truppen i ett tryck (snabb föranmälan vid rinken, kalla händer); grön "Markera alla · N", röd "Avmarkera alla" när alla redan anmälda (auto-fallback, 21:a sprintet utan ✅ Approved feature) | 264 → 264 | ✅ Klar |
| 56 | 2026-06-10 | useTaktiktavlaCanvas-hook extraherad från TaktiktavlaTab.jsx (485→217 rader) → src/hooks/useTaktiktavlaCanvas.js — all canvas/token-logik (init/resize, ritverktyg, undo, två-stegs-rensa, token-drag, export, Spara/Dela); komponenten enbart presentation · F (✅ Approved): Närvarodata migrerad localStorage→Supabase — ny tabell training_attendance (en rad per session+spelare, konfliktfri vid samtidiga avbockningar), optimistisk toggle med rollback, 60s-polling, engångsmigrering av legacy hibs_att; konsument-API oförändrat. ⚠️ Kräver SQL-migration (docs/RESEARCH.md Sprint 56) | 264 → 264 | ✅ Klar |
| 58 | 2026-06-16 | SubstitutionPanel extraherad från LiveMatchView.jsx (590→448 rader) → src/components/match/SubstitutionPanel.jsx — spelarbyte-UI med egen state (subOpen/subOut), härleder on-/off-pitch internt; LiveMatchView blev statelös (useState borttagen) · F: Glance-rad "X på plan · Y på bänken" under 🔄 Byte-knappen — bänk-siffran röd + "inga avbytare" när truppen är tom, så man vid rinken med kalla händer ser direkt om byte är möjligt innan man trycker (auto-fallback, 23:e sprintet utan ✅ Approved feature) | 265 → 265 | ✅ Klar |
| 57 | 2026-06-12 | usePoll-hook skapad → src/hooks/usePoll.js — konsoliderar de tre polling-looparna (loadData 60s, useAttendance 60s, useLiveMatchPoll 10s); pausar vid dold flik (Page Visibility) + offline, omedelbar refetch vid wake/online → färre requests, batterisnålare vid rinken. Supabase Realtime utvärderad och avvisad (kräver supabase-js, fel trade-off — se docs/RESEARCH.md S57) · F: OfflineBanner.jsx — gul banner när nätet försvinner i hallen ("Offline — ändringar sparas inte just nu"), förklarar varför optimistiska skrivningar studsar tillbaka; navigator.onLine + online/offline-events, role=status (auto-fallback, 22:a sprintet utan ✅ Approved feature) | 264 → 265 | ✅ Klar |
| 59 | 2026-06-18 | MatchShotStats extraherad från LiveMatchView.jsx (448→392 rader) → src/components/match/MatchShotStats.jsx — skottstatistik-kortet (HIBS skott + konvertering, målvaktsräddningar + räddnings-%) flyttat ut ur inline-IIFE till statelös presentationskomponent; allt härlett ur befintlig matchdata · F: Glance-rad "Skottövertag ±X (sf–sa)" under skott-korten — färgkodad grön/röd/grå skillnad mellan HIBS skott och skott mot, så tränaren vid rinken (kalla händer, glance) direkt ser om laget skapar mer än motståndaren; 0 ny state, 0 schema-ändring, följer header-indikator-mönstret från S41–43/S58 (auto-fallback, 24:e sprintet utan ✅ Approved feature) | 265 → 266 | ✅ Klar |
| 60 | 2026-06-22 | GoalCard extraherad från GoalModal.jsx (372→201 rader) → src/components/players/GoalCard.jsx — det enskilda kollapsbara mål-kortet (typ/säsong/status, spelarmål/feedback/utmaning, uppföljning, radera) flyttat till statelös komponent; modalen behåller state, auto-save och migrering. Dödkod städad (oanvänd fmtDate). esbuild kompilerar rent · F: Glance-färgat uppföljnings-chip i kollapsad vy — röd "X d sen" vid försenad uppföljning, amber "om X d" vid ≤7 dagar, blå annars; döljs på Uppnått-mål (ingen uppföljning behövs). Tränaren ser direkt vilka mål som behöver följas upp utan att öppna varje kort; 0 ny state, 0 schema-ändring (auto-fallback, 25:e sprintet utan ✅ Approved feature) | 266 → 267 | ✅ Klar |
| 61 | 2026-06-24 | Slutförd S60-extraktion: inline MÅLVAKTSSTATISTIK-block (~45 rader) i StatsContent.jsx ersatt med den redan utbrutna men oanvända `<KeeperStatsCard>`-komponenten — död import aktiverad, duplicerad JSX borta; StatsContent 355→317 rader · F: Målskillnad-chip (+N/−N) i säsongsöversiktens nedre rad — gjorda minus insläppta mål, grön vid positiv / röd vid negativ / grå vid 0, döljs utan spelade matcher; 0 ny state, 0 schema-ändring, härlett ur befintlig goalsFor/goalsAgainst, glance-värde vid rinken (auto-fallback, 26:e sprintet utan ✅ Approved feature) | 267 → 267 | ✅ Klar |
| 62 | 2026-06-28 | Städat bort den döda `reserves`-prop-kedjan MatchContent → LiveMatchView (S61 Next-sprint-guidning): prop destrukturerades i LiveMatchView men användes aldrig, och MatchContent drog bara ut `reserves`/`setReserves` ur `{...matchSession}`-spread för att skicka vidare. Borttagen i båda filerna. `reserves`-state kvarstår i useMatchSession (loggat som backlog för djupare cleanup) · F: Lead-state-chip i live-match-headern under resultatsiffran — "Leder +N" (grön) / "Under −N" (röd) / "Oavgjort" (grå), så tränaren vid rinken (kalla händer, glance) direkt ser matchläget utan att läsa siffrorna; 0 ny state, 0 schema-ändring, härlett ur befintlig matchResult, följer glance-chip-mönstret från S41–43/S58–61 (auto-fallback, 27:e sprintet utan ✅ Approved feature) | 267 → 267 | ✅ Klar |
| 63 | 2026-06-30 | Slutförde S62:s uppskjutna `reserves`-state-städning i useMatchSession.js: tog bort den döda `reserves`/`setReserves`-useState, dess localStorage-persistering (`hibs_reserves2`), return-exporten och den föräldralösa `setReserves([])`-nollställningen i post-match-blocket. State skrevs till localStorage vid varje ändring men lästes aldrig av någon konsument efter att S62 tog bort prop-kedjan. `hibs_reserves2`-nyckeln i useAuth:s logout-rensning behållen så befintliga användares gamla nyckel städas bort · F: Form-svit-chip i STATS → MATCHHISTORIK-headern — "🔥 N raka vinster" (grön) / "N raka förluster" (röd) / "N raka oavgjorda" (gul), färgkodad via formColor, visas bara vid svit ≥2 matcher; härlett ur history (date.desc, nyaste först), 0 ny state, 0 schema-ändring, glance-momentum vid rinken (auto-fallback, 28:e sprintet utan ✅ Approved feature) | 267 → 267 | ✅ Klar |
| 64 | 2026-07-02 | AuthScreen.jsx (317 rader, största kvarvarande monoliten) nedbruten: `ClubSetup.jsx` extraherad (choose/create/join-klubb-flödet med egna steg-states, doCreateClub/doJoinClub/searchClubs) + `authUi.jsx` (delad `inpStyle` + `AuthButton`); AuthScreen 317→206 rader. Redundant dynamisk `DEFAULT_PLAYERS`-import i doJoinClub borttagen (var redan statiskt importerad) · F: Visa/dölj lösenord-toggle (👁️/🙈) i login/register — 48px touch-target, aria-label, type växlar password/text; färre felinloggningar med kalla händer, extra värdefullt för föräldrar som registrerar sig via invite-länk vid rinken (auto-fallback, 29:e sprintet utan ✅ Approved feature) | 267 → 267 | ✅ Klar |
| 65 | 2026-07-06 | LiveMatchView.jsx (415 rader, nu störst i src/components/match/) nedbruten: `ScoringPanel.jsx` extraherad → src/components/match/ScoringPanel.jsx (135 rader) — MÅL/ASSIST-knappraderna + Händelselogg (självständig state via matchScorers/setMatchResult-props, samma mönster som SubstitutionPanel/MatchShotStats); LiveMatchView 415→312 rader · F: "↩ Ångra senaste"-genväg i händelseloggens header — ett tryck rättar det senast registrerade målet/assisten (justerar matchResult vid mål) utan att scrolla ner och hitta rätt ✕ i listan; 0 ny state, 0 schema-ändring, återanvänder befintlig unda-logik (auto-fallback, 30:e sprintet utan ✅ Approved feature) | 265 → 265 | ✅ Klar |
| 66 | 2026-07-08 | TeamMessages.jsx (254 rader, nu störst i src/components/mer/) nedbruten: `MessageComposer.jsx` extraherad → src/components/mer/MessageComposer.jsx (103 rader) — inputfält + brådskande-toggle + skicka-knapp, äger eget text/urgent/sending-state och exponerar `onSend(body, urgent)`; TeamMessages 254→238 rader · F: Två-stegs-bekräftelse på "🗑 Ta bort" för egna meddelanden — första tryck visar "✓ Bekräfta borttagning"/"Avbryt", auto-avväpnas efter 4s; skyddar mot feltryck vid rinken (kalla händer, trängsel) där en radering annars är permanent och oåterkallelig, samma säkerhetsmönster som Rensa-bekräftelsen i Taktiktavlan (S50) (auto-fallback, 31:a sprintet utan ✅ Approved feature) | 265 → 265 | ✅ Klar |
| 67 | 2026-07-20 | T (✅ Approved): Dubbel övningsladdning löst — App.jsx är nu enda källan för exercises (lätt kolumnlista utan canvas_drawing-blobbar, bevarar S37:s lazy-load i ExerciseDetailSheet); OvningarTab tar exercises/setExercises som props, egen sbGet/loading-state borttagen (195→187 rader). Bonus: 60s-pollingen synkar nu övningar mellan tränare · F (✅ Approved, P2 — första approvade featuren på 31 sprintar): Trend per spelare i STATS → SPELARSTATISTIK — tappbar rad (≥44px) expanderar inline stapel-sparkline med poäng per match (senaste 10, äldst→nyast; amber=mål, blå=assist, dov=spelade utan poäng) + summering; ny playerTrends i useSeasonStats (0-poster för deltagande utan poäng = ärlig trend), 0 schema-ändring | 265 → 267 | ✅ Klar |
| 68 | 2026-09-01 | F (Andreas-direkt): 5-mannakedjor (1-2-2: 1:a, H2, V2, H3, V3) för säsongens 5v5-spel — nytt formatsystem i constants (LINE_FORMATS/lineSlotKeys/POS_MAP_5TO4), per-lina-toggle 5v5/4v4 i FormationCard (4v4 = gamla 1-2-1), default 4×5-mannalinor, formatoberoende lines2-snapshot + MatchCard-historik (bakåtkompatibel med gamla sparade linor) · "⭐ Ladda grundkedjor"-knapp i Kedjor-vyn: GRUNDKEDJOR HT-26 (William/Joel/Jonas/Linus-linorna) namnmatchas prefix-tolerant mot vald trupp (matchPlayerByName) · Träningens CHAIN_POS uppdaterad till 5 positioner | 267 → 267 | ✅ Klar |
| 69 | 2026-09-01 | F (🟠 Approved: matchdag-flöde): Steg-baserat matchflöde — ny startvy (MatchStartView: stora schemakort med RSVP-count + "+ Ny match" + cup-fortsättning), stegindikator 1 Match → 2 Trupp → 3 Kedjor (MatchStepBar), steg 1 MatchSetupStep (motståndare störst/först, cup-läge + lagmål bakom "Fler alternativ"-expander), steg 2 inverterat truppval (alla friska förvalda — bocka av frånvarande, genomstruken = borta, stora Välj alla friska/Rensa-knappar), steg 3 auto-laddar grundkedjor vid tom kedjevy · Refaktorering: MatchSquadSection bantad till rent trupp-steg, match-SubTabBar borttagen ur App.jsx (dubbel navigering), matchStep default "start", spärrknappar förklarar alltid vad som saknas · ~20 interaktioner → ~6 för att starta match | 267 → 262 | ✅ Klar |
| 70–74 | 2026-09-02 | UX-genomgång hela appen, fem sprintar i klump: **S70** TodayCard på Hem (match idag → rakt in i matchflödet) · **S71** LatestMessageCard på Hem (senaste lagmeddelandet med genväg till Mer→Meddelanden) + Mer-listan sorterad efter användning · **S72** AppContext (src/lib/AppContext.jsx) — clubId/uid/tok/profile/players/updP via useApp(); MerContent −8 props, HomeContent −3; sbPatch/sbDel importeras direkt · **S73** Delad ConfirmDialog.jsx ersätter inline-overlays i MatchContent + LiveMatchView; FONT-tokens i HomeContent-labels · **S74** Grupper konsoliderade: gruppbyte (A–E/MV) inbyggt i Spelarlistan (inline-picker), Mer→"Grupper & kedjor" (GrupperDnD, desktop-drag som inte funkade på touch) borttagen — grupper hanteras i Träning→Kedjor + Spelarlistan | 262 → 264 | ✅ Klar |
| 75 | 2026-09-02 | F (Andreas-direkt): Matchlärdomar — MatchLessonsModal ("Vad såg du? 🧠") öppnas direkt efter Avsluta match, före feedback-overlayen; text sparas i matchens befintliga note-kolumn (append, skriver aldrig över) · PlaneraTab visar "🧠 Bensin från senaste matchen" (expanderbar, pre-wrap) överst i bygg-läget via matchFuel-prop — lärdomarna ligger exakt där nästa träning planeras · 0 schema-ändringar; modalen använder AppContext (S72) | 264 → 268 | ✅ Klar |
| 76 | 2026-09-02 | F (Andreas-direkt): Snabbanteckningar överallt — 🧠-knapp i AppHeader (alla flikar) öppnar QuickNoteSheet: textarea (16px = ingen iOS-zoom) → sparas i training_notes (delas mellan tränarna, samma tabell som Hem-notiserna) · PlaneraTab visar "🧠 Anteckningar att träna på" (trainNotes-prop) tillsammans med matchbensinen — allt underlag för nästa träning på ett ställe · QuickNoteSheet använder AppContext | 268 → 272 | ✅ Klar |
| 77 | 2026-09-02 | F (Andreas-direkt): Säsongsimport 26/27 — 40 matcher (serier 14A/14B/15A 4vs4 + 5 cuper som cupdagar) importerade till Supabase från laget-kalenderns skärmbilder · Schema-migration: `matches.time` + `matches.venue` (text, nullable) — KÖRD i produktion via Supabase MCP · App: SERIES utökad (14B, 15A 4vs4), delad serieColor()-helper i constants (ersätter två inline-varianter), tid+hall visas i TodayCard/UpcomingMatchCard/MatchStartView, startvyn visar max 5 kommande + räknare · OBS: 5 gamla vårposter (mars–apr) ligger kvar som is_upcoming — Andreas tar bort i appen | 272 → 272 | ✅ Klar |
