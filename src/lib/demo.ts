import { composePlan } from "./engine";
import type { Person, Recommendation, RunInput, RunResult } from "./types";

export const DEMO_GROUP: { people: Person[]; location: string; intent: RunInput["intent"] } = {
  location: "New York",
  intent: "weekend",
  people: [
    { name: "Maya", interests: [
      { query: "Radiohead", category: "artist" },
      { query: "Spirited Away", category: "movie" },
      { query: "Norwegian Wood", category: "book" },
    ] },
    { name: "Leo", interests: [
      { query: "Daft Punk", category: "artist" },
      { query: "Blade Runner 2049", category: "movie" },
      { query: "Zelda Breath of the Wild", category: "videogame" },
    ] },
    { name: "Priya", interests: [
      { query: "Frank Ocean", category: "artist" },
      { query: "Everything Everywhere All at Once", category: "movie" },
      { query: "Patagonia", category: "brand" },
    ] },
  ],
};

export const SAMPLE_PROFILES: Person[] = [
  { name: "The cinephile", interests: [
    { query: "Wes Anderson's The Grand Budapest Hotel", category: "movie" },
    { query: "Parasite", category: "movie" },
    { query: "Phoebe Bridgers", category: "artist" },
  ] },
  { name: "The foodie", interests: [
    { query: "Momofuku", category: "place" },
    { query: "Anthony Bourdain Kitchen Confidential", category: "book" },
    { query: "Kendrick Lamar", category: "artist" },
  ] },
  { name: "The gamer", interests: [
    { query: "Hades", category: "videogame" },
    { query: "Studio Ghibli Princess Mononoke", category: "movie" },
    { query: "Nike", category: "brand" },
  ] },
];

/** Deterministic, clearly-labelled fixture. NOT Qloo output. */
export function runDemo(input: RunInput): RunResult {
  const names = input.people.map((p) => p.name || "Someone");
  const pick = (i: number) => names[i % names.length];
  const via = (i: number) => {
    const p = input.people[i % input.people.length];
    return p?.interests[0]?.query || "their favorites";
  };
  const base: Omit<Recommendation, "groupScore">[] = [
    { id: "demo-1", name: "[Demo] Neighborhood listening bar", type: "urn:entity:place", category: "place", affinity: null, tags: ["vinyl", "cocktails", "cozy"], connects: [0, 1].map((i) => ({ person: pick(i), via: via(i), score: null })), reason: "Demo fixture: illustrates a music-forward venue suggestion." },
    { id: "demo-2", name: "[Demo] Indie animation double feature", type: "urn:entity:movie", category: "movie", affinity: null, tags: ["animation", "fantasy"], connects: [0, 2].map((i) => ({ person: pick(i), via: via(i), score: null })), reason: "Demo fixture: illustrates a film pick bridging two people." },
    { id: "demo-3", name: "[Demo] Late-night ramen counter", type: "urn:entity:place", category: "place", affinity: null, tags: ["japanese", "casual"], connects: [1, 2].map((i) => ({ person: pick(i), via: via(i), score: null })), reason: "Demo fixture: illustrates a food stop." },
    { id: "demo-4", name: "[Demo] Electronic-soul crossover artist", type: "urn:entity:artist", category: "artist", affinity: null, tags: ["electronic", "r&b"], connects: [0, 1, 2].map((i) => ({ person: pick(i), via: via(i), score: null })), reason: "Demo fixture: illustrates an artist connecting the whole group." },
    { id: "demo-5", name: "[Demo] Literary sci-fi novel", type: "urn:entity:book", category: "book", affinity: null, tags: ["sci-fi", "literary"], connects: [0].map((i) => ({ person: pick(i), via: via(i), score: null })), reason: "Demo fixture: illustrates a book pick." },
  ];
  const recommendations = base.map((r, i) => ({ ...r, groupScore: 1 - i * 0.12 }));
  const total = input.people.reduce((n, p) => n + p.interests.length, 0);
  return {
    mode: "demo",
    resolved: input.people.flatMap((p) => p.interests.map((it) => ({ person: p.name, query: it.query, category: it.category, error: "demo mode — not resolved" }))),
    trace: [
      { stage: "Resolving interests", detail: `${total} favorites (demo — no API calls)`, calls: 0, ok: 0 },
      { stage: "Mapping taste signals", detail: "Demo fixture signals", calls: 0, ok: 0 },
      { stage: "Finding shared affinities", detail: "Demo fixture candidates", calls: 0, ok: 0 },
      { stage: "Assembling shortlist", detail: `${recommendations.length} demo cards`, calls: 0, ok: 0 },
    ],
    recommendations,
    plan: composePlan(input, recommendations),
    warnings: ["Demo data: these results are sample fixtures, not Qloo output."],
  };
}
