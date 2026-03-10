# HIBS Tränarapp — Roadmap & Förbättringar

*Senast uppdaterad: 2026-03-10*
*Status: Aktiv utveckling (privat bruk)*
*Chefsutvecklare: Claude | Produktägare: Andreas*

---

## Appöversikt

HIBS är en tränarapp för innebandylaget P2015, byggd med React + Vite + Supabase, deployad via Netlify.

**Befintliga features:**
- Auth (login/register/klubb-system)
- Spelarlista med grupper (A–E + MV), anteckningar, individuella mål
- Matchhantering: uppställning, linjer, målvakter, resultat, målskyttar/assists
- Träning: kedjor, scramble, grupper, blandning, planering, övningsbibliotek
- Säsongsplan med roadmap & checklista
- Matchhistorik

---

## Andreas anteckningar (från Apple Notes)

### 🏠 Hem
*(Inga specifika anteckningar ännu — se förslag under Fas 2)*

### 🏋️ Träning

- [ ] **Målvakter i scramble** — Om jag väljer målvakt som närvarande på träning ska de INTE vara med i scramble. De ska stå i mål.
- [ ] **Scramble-regler / hårdregler** — Vissa spelare ska inte spela 1:a-position. Lägg in hårdregel att Benji och Sigge aldrig kan vara 1:a.
- [ ] **Övningsbiblioteket** — Vill utveckla detta:
  - Enklare förklaringar
  - Ritexempel på en tavla (visuell illustration)
  - Favorit-system (markera övningar man gillar)
  - Tydligare uppdelning per typ med beskrivning, t.ex: *"Bananen — övar på passningar, får målvakten att göra mkt sidled, övar på att göra sig redo för skott i fart"*

### ⚽ Match

- [ ] **3 lagmål per match** — Utöver att vinna: 3 mål som spelarna får sätta. Exempel: "inte klaga på domaren"
- [ ] *(Kopplat till lagmål-fliken)*

### 👥 Spelarlista

- [ ] **Måluppföljning** — När man lagt till ett mål för en spelare: hur lång tid till uppföljning? Hur följa upp? Behöver ett system för detta.

### 🎯 Lagmål & Checklista
*(Inga specifika anteckningar — se förslag under Fas 2)*

### 📊 Matchhistorik
*(Inga specifika anteckningar — se förslag under Fas 2)*

### 📅 Säsongsplan
*(Inga specifika anteckningar — se förslag under Fas 2)*

---

## Chefsutvecklarens förslag

### Fas 0 — Teknisk skuld (FÖRST)

> *Innan vi bygger nytt måste grunden vara stabil. Appen är 1 566 rader i en enda fil.*

| # | Uppgift | Varför | Prioritet |
|---|---------|--------|-----------|
| T1 | Bryt ut App.jsx till separata komponentfiler | Omöjligt att underhålla 1566 rader i en fil. Minskar buggrisken enormt | 🔴 Kritisk |
| T2 | Flytta Supabase-nycklar till .env-fil | Nycklar ligger synliga i koden — säkerhetsrisk om repot är publikt | 🔴 Kritisk |
| T3 | Skapa mappstruktur: components/, hooks/, utils/, lib/ | Gör det enkelt att hitta och ändra saker | 🔴 Kritisk |
| T4 | Sätt upp .gitignore ordentligt (.env, .DS_Store, node_modules) | Förhindrar att känsliga filer hamnar på GitHub | 🔴 Kritisk |
| T5 | Skapa en Supabase-klient (lib/supabase.js) istället för raw fetch | Renare kod, enklare att byta auth-metod senare | 🟡 Hög |
| T6 | Extrahera inline-styles till CSS-moduler eller Tailwind | Minskar kodens storlek med ~40%, lättare att ändra utseendet | 🟡 Hög |

### Fas 1 — Dina önskemål (SEDAN)

| # | Feature | Källa | Prioritet |
|---|---------|-------|-----------|
| F1 | Målvakter exkluderas automatiskt från scramble | Andreas Notes | 🔴 Hög |
| F2 | Hårdregel: spelare som inte kan spela 1:a (Benji, Sigge — konfigurerbart) | Andreas Notes | 🔴 Hög |
| F3 | Övningsbibliotek: enklare förklaringar + ritexempel (SVG-tavla) | Andreas Notes | 🟡 Medel |
| F4 | Övningsbibliotek: favoritsystem | Andreas Notes | 🟡 Medel |
| F5 | Övningsbibliotek: tydligare typbeskrivning med "vad den övar på" | Andreas Notes | 🟡 Medel |
| F6 | 3 lagmål per match (sätts av spelarna) | Andreas Notes | 🔴 Hög |
| F7 | Måluppföljningssystem för individuella mål (tid + metod) | Andreas Notes | 🟡 Medel |

### Fas 2 — Mina förslag (NÄR GRUNDEN ÄR KLAR)

| # | Feature | Varför | Prioritet |
|---|---------|--------|-----------|
| P1 | **Hem-dashboard** — snabb överblick: nästa match, antal matcher spelade, lagets form, senaste träning | Hem-fliken saknar innehåll — bör vara "landningssidan" | 🟡 Medel |
| P2 | **Spelarstatistik** — mål/assist per spelare, trendgrafer per säsong | Motiverande för spelarna + bra för tränaren | 🟡 Medel |
| P3 | **Närvarodata** — spåra vilka som är på träning, se trends | Hjälper identifiera spelare som missar mycket | 🟡 Medel |
| P4 | **Matchbetyg/kommentarer per spelare** — kort bedömning efter match | Värdefullt vid utvecklingssamtal | 🟢 Låg |
| P5 | **Föräldrakommunikation** — enkel notis/SMS-integration för matchinfo | Sparar tid på att skicka meddelanden | 🟢 Framtid |
| P6 | **Offline-stöd (PWA)** — appen fungerar utan internet | Viktigt i hallar med dålig täckning | 🟢 Framtid |
| P7 | **Responsiv desktop-layout** — bättre upplevelse på stor skärm | Om andra tränare ska använda den | 🟢 Framtid |
| P8 | **Multi-lag stöd** — en tränare, flera lag | Nödvändigt om appen ska skalas till andra tränare | 🟢 Framtid |

---

## Arbetsprocess

1. Andreas godkänner uppgifter i detta dokument (markera med ✅)
2. Claude implementerar och dokumenterar ändringar
3. Andreas pushar till GitHub + deployas automatiskt via Netlify
4. Nya idéer läggs till under "Anteckningar" → Claude strukturerar dem

---

## Beslutlog

| Datum | Beslut | Kommentar |
|-------|--------|-----------|
| 2026-03-10 | Roadmap skapad | Första versionen baserad på Andreas Apple Notes |
| 2026-03-10 | Sprint 1 klar | HomeContent extraherad till src/components/home/HomeContent.jsx. App.jsx 648→561 rader. |
| | | |

---

*Nästa steg: Andreas godkänner prioriteringen, sedan börjar vi med Fas 0 (teknisk skuld).*
