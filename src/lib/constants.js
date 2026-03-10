// Date helpers
export const TODAY = () => new Date().toISOString().slice(0, 10);
export const FMT = (d) =>
  d
    ? new Date(d).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })
    : "-";

// Line helper
export const mkLine = (id) => ({
  id,
  name: "Linje " + id,
  slots: { forward: null, vanster: null, hoger: null, back: null },
});

// Shuffle helper
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Group colors
export const GC = {
  A: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)" },
  B: { color: "#38bdf8", bg: "rgba(56,189,248,0.12)", border: "rgba(56,189,248,0.3)" },
  C: { color: "#f472b6", bg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.3)" },
  D: { color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)" },
  E: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" },
  MV: { color: "#fb923c", bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.3)" },
  _: { color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)" },
};
export const gc = (g) => GC[g] || GC._;

// Position colors & labels
export const PCOLOR = { forward: "#f472b6", vanster: "#38bdf8", hoger: "#34d399", back: "#a78bfa" };
export const PLABEL = { forward: "FWD", vanster: "VA", hoger: "HO", back: "BCK" };

// Series & groups
export const SERIES = ["14A", "15A", "Cupmatch", "Traningsmatch"];
export const GROUPS = ["A", "B", "C", "D", "E"];

// Exercise categories
export const CAT_COLOR = {
  Spelövning: "#38bdf8",
  Anfallsövning: "#f472b6",
  Försvarsövning: "#a78bfa",
  Teknikövning: "#fbbf24",
  Färdighetsövning: "#fb923c",
  "Rolig övning": "#34d399",
};
export const CATEGORIES = [
  "Alla", "Spelövning", "Anfallsövning", "Försvarsövning",
  "Teknikövning", "Färdighetsövning", "Rolig övning",
];
export const INTENSITIES = ["Alla", "Låg", "Medel", "Hög"];

// Chain positions
export const CHAIN_POS = ["1:a", "V2:a", "H2:a", "3:a"];
export const CHAIN_COL = { "1:a": "#f472b6", "V2:a": "#38bdf8", "H2:a": "#34d399", "3:a": "#a78bfa" };

// Default players (used when creating a new club)
export const DEFAULT_PLAYERS = [
  { name: "Joel", group: "A" }, { name: "Oliver", group: "A" }, { name: "Rasmus", group: "A" }, { name: "Lucas", group: "A" },
  { name: "William", group: "B" }, { name: "Mille", group: "B" }, { name: "Marcus", group: "B" }, { name: "Charlie M", group: "B" },
  { name: "Lo", group: "C" }, { name: "Ludde M", group: "C" }, { name: "Jacob", group: "C" }, { name: "Linus", group: "C" },
  { name: "Hugo T", group: "D" }, { name: "Freke", group: "D" }, { name: "Viktor", group: "D" }, { name: "Charlie E", group: "D" },
  { name: "Jonas", group: "E" }, { name: "Arvid", group: "E" }, { name: "Sigge", group: "E" }, { name: "Benji", group: "E" },
  { name: "Loke", group: "MV", role: "malvakt" }, { name: "Otto", group: "MV", role: "malvakt" },
];

// Checklist initial data
export const CHECKLIST_INIT = [
  {
    category: "Mental styrka", color: "#a78bfa", items: [
      { id: "c1", text: "Vi har pratat om guldfisk-principen med spelarna", done: false },
      { id: "c2", text: "Spelarna har en reset-rutin vid motgang", done: false },
      { id: "c3", text: "Vi anvander delmal utover resultat vid match", done: false },
      { id: "c4", text: "Laget vet vad nasta aktion betyder", done: false },
    ],
  },
  {
    category: "Spelfilosofi", color: "#38bdf8", items: [
      { id: "c5", text: "Speliden ar nedskriven och kommunicerad", done: false },
      { id: "c6", text: "Spelarna kan forklara vinn boll ga", done: false },
      { id: "c7", text: "Vi tranar gapet mellan 2 spelare aktivt", done: false },
      { id: "c8", text: "Lopningar bakom ryggar i minst 2 ovningar per traning", done: false },
      { id: "c9", text: "Malvakten har en tydlig roll i uppspelet", done: false },
    ],
  },
  {
    category: "Lagkultur", color: "#f472b6", items: [
      { id: "c10", text: "Lagkontrakt skrivet med spelarna", done: false },
      { id: "c11", text: "Foraldramote genomfort infor sasongen", done: false },
      { id: "c12", text: "Foraldrartranig bokad eller genomford", done: false },
      { id: "c13", text: "Konsekvenssystemet tydligt for alla spelare", done: false },
    ],
  },
  {
    category: "Fysik", color: "#34d399", items: [
      { id: "c14", text: "Knakontroll del av varje uppvarmning", done: false },
      { id: "c15", text: "Stretch inbyggt i traningsrutinen", done: false },
      { id: "c16", text: "Spelarna vet varfor de gor knaovningarna", done: false },
    ],
  },
  {
    category: "Verktyg", color: "#fbbf24", items: [
      { id: "c17", text: "Padlet uppsatt och delat med tranarlaget", done: false },
      { id: "c18", text: "Vi foljer relevanta Instagram-konton", done: false },
      { id: "c19", text: "Individuella mal dokumenterade", done: false },
    ],
  },
];

// Roadmap initial data
export const ROADMAP_INIT = [
  {
    period: "Nu - Feb", label: "Forberedelse", color: "#a78bfa", bg: "rgba(167,139,250,0.08)", tasks: [
      { id: "r1", text: "Satt upp Padlet for laget", done: false },
      { id: "r2", text: "Folj relevanta Instagram-konton", done: false },
      { id: "r3", text: "Skriv ner er spelide", done: false },
      { id: "r4", text: "Bestam speluppstallning 1-2-1", done: false },
      { id: "r5", text: "Skapa lagkontrakt med spelarna", done: false },
      { id: "r6", text: "Planera foraldramote", done: false },
    ],
  },
  {
    period: "Feb - Mar", label: "Traningsstart", color: "#38bdf8", bg: "rgba(56,189,248,0.08)", tasks: [
      { id: "r7", text: "Introducera knakontroll i varje uppvarmning", done: false },
      { id: "r8", text: "Kor foraldrartranig", done: false },
      { id: "r9", text: "Borja med individuella mal", done: false },
      { id: "r10", text: "Trana reset-rutin", done: false },
      { id: "r11", text: "Bygg in positionsbyte i varje traning", done: false },
      { id: "r12", text: "Introducera delmalspoang", done: false },
    ],
  },
  {
    period: "Mar - Apr", label: "Seriestart", color: "#f472b6", bg: "rgba(244,114,182,0.08)", tasks: [
      { id: "r13", text: "Satt prestationsmal vid match", done: false },
      { id: "r14", text: "Bestam matchregel bara fragor fran banken", done: false },
      { id: "r15", text: "Genomgang vad ar guldfisk-tanket", done: false },
      { id: "r16", text: "Malvakterna specifikt ansvar i spelet", done: false },
      { id: "r17", text: "Utvardera lagkulturen efter 3 matcher", done: false },
    ],
  },
  {
    period: "Lopande", label: "Hela sasongen", color: "#34d399", bg: "rgba(52,211,153,0.08)", tasks: [
      { id: "r18", text: "Lar kanna spelarna", done: false },
      { id: "r19", text: "Avsluta varje traning positivt", done: false },
      { id: "r20", text: "Ge ratt beteende uppmarksamhet", done: false },
      { id: "r21", text: "Frukt tillganglig innan traning", done: false },
      { id: "r22", text: "Reflektera manadsvis om speliden", done: false },
    ],
  },
];
