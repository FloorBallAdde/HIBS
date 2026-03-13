# HIBS — Nuvarande arkitektur & refaktoreringsplan

*Senast uppdaterad: 2026-03-13 (Sprint 7 klar)*

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
    │   └── useData.js            ← Data-laddning (spelare, matcher, etc.)
    ├── components/
    │   ├── ui/
    │   │   ├── StableInput.jsx
    │   │   ├── BottomNav.jsx       ← Sprint 7
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
