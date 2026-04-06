# HIBS — Nuvarande arkitektur & refaktoreringsplan

*Senast uppdaterad: 2026-03-24 (Sprint 21 klar)*

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
    │   │   ├── BlandaMode.jsx
    │   │   ├── PlaneraTab.jsx
    │   │   └── OvningarTab.jsx
    │   ├── season/
    │   │   ├── Checklist.jsx
    │   │   └── Roadmap.jsx
    │   ├── mer/
    │   │   └── MerContent.jsx      ← Sprint 3: extraherad mer-vy
    │   └── home/
    │       └── HomeContent.jsx   ← Sprint 1: extraherad hem-vy
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
