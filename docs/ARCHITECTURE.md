# HIBS — Nuvarande arkitektur & refaktoreringsplan

*Senast uppdaterad: 2026-05-14 (Sprint 48 klar)*

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
    │   │   └── AuthScreen.jsx
    │   ├── players/
    │   │   ├── PlayerList.jsx
    │   │   ├── NoteModal.jsx
    │   │   └── GoalModal.jsx
    │   ├── match/
    │   │   ├── MatchContent.jsx      ← Sprint 2
    │   │   ├── MatchNoteModal.jsx    ← Sprint 6: extraherad från App.jsx
    │   │   ├── LiveMatchView.jsx     ← Sprint 9: live-match-vy
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
    │   │   └── TeamMessages.jsx    ← Sprint 26: lagmeddelanden (P11 Fas 1)
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
