import { CATEGORIES, INTENTS, type Category, type Recommendation, type RunInput } from "./types";

/** Deterministic, client-safe plan composer. Template-based, no LLM. */
export function composePlan(input: RunInput, recs: Recommendation[]): string[] {
  const where = input.location ? ` in ${input.location}` : "";
  const by = (c: Category) => recs.filter((r) => r.category === c);
  const lines: string[] = [];
  const place = by("place");
  if (place[0]) lines.push(`Start at ${place[0].name}${place[0].address ? ` (${place[0].address})` : where}.`);
  if (place[1]) lines.push(`Continue to ${place[1].name} for a second stop.`);
  const movie = by("movie")[0];
  if (movie) lines.push(`Wind down with ${movie.name}.`);
  const artist = by("artist")[0];
  if (artist) lines.push(`Soundtrack the outing with ${artist.name}.`);
  const book = by("book")[0];
  if (book) lines.push(`Group read for next time: ${book.name}.`);
  const game = by("videogame")[0];
  if (game) lines.push(`Optional game night pick: ${game.name}.`);
  if (!lines.length && recs[0]) lines.push(`Start with ${recs[0].name}.`);
  if (lines.length) lines.unshift(`A ${INTENTS[input.intent].label.toLowerCase()} plan${where}:`);
  return lines;
}

export function categoryFromType(type: string): Category {
  const hit = (Object.keys(CATEGORIES) as Category[]).find((k) => CATEGORIES[k].urn === type);
  return hit ?? "other";
}
