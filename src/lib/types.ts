export const CATEGORIES = {
  artist: { label: "Artist / Music", urn: "urn:entity:artist" },
  movie: { label: "Movie / TV", urn: "urn:entity:movie" },
  book: { label: "Book", urn: "urn:entity:book" },
  place: { label: "Place / Restaurant", urn: "urn:entity:place" },
  brand: { label: "Brand", urn: "urn:entity:brand" },
  videogame: { label: "Video game", urn: "urn:entity:videogame" },
  other: { label: "Other", urn: null },
} as const;
export type Category = keyof typeof CATEGORIES;

export const INTENTS = {
  open: { label: "Open discovery", targets: ["place", "movie", "artist", "book"] },
  food: { label: "Food", targets: ["place"] },
  culture: { label: "Culture", targets: ["place", "artist", "book"] },
  date: { label: "Date night", targets: ["place", "movie"] },
  weekend: { label: "Weekend", targets: ["place", "movie", "artist"] },
  entertainment: { label: "Entertainment", targets: ["movie", "videogame", "artist"] },
} as const satisfies Record<string, { label: string; targets: Category[] }>;
export type Intent = keyof typeof INTENTS;

export interface Interest { query: string; category: Category }
export interface Person { name: string; interests: Interest[] }
export interface RunInput { people: Person[]; location?: string | undefined; intent: Intent }

export interface Resolved {
  person: string; query: string; category: Category;
  entityId?: string; name?: string; type?: string; error?: string;
}
export interface TraceStep { stage: string; detail: string; calls: number; ok: number }
export interface Recommendation {
  id: string; name: string; type: string; category: Category;
  affinity: number | null; groupScore: number;
  tags: string[]; address?: string; image?: string;
  connects: { person: string; via: string; score: number | null }[];
  reason: string;
}
export interface RunResult {
  mode: "live" | "demo";
  resolved: Resolved[];
  trace: TraceStep[];
  recommendations: Recommendation[];
  plan: string[];
  warnings: string[];
}
