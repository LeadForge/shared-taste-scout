import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { categoryFromType, composePlan } from "./engine";
import { runDemo } from "./demo";
import { CATEGORIES, INTENTS, type Category, type Recommendation, type Resolved, type RunResult, type TraceStep } from "./types";

const HOST = "https://hackathon.api.qloo.com";

const InputSchema = z.object({
  people: z.array(z.object({
    name: z.string().trim().max(40),
    interests: z.array(z.object({
      query: z.string().trim().min(1).max(120),
      category: z.enum(["artist", "movie", "book", "place", "brand", "videogame", "other"]),
    })).min(1).max(5),
  })).min(2).max(5),
  location: z.string().trim().max(80).optional(),
  intent: z.enum(["open", "food", "culture", "date", "weekend", "entertainment"]),
  forceDemo: z.boolean().optional(),
});

async function qloo(path: string, params: Record<string, string>, key: string): Promise<any> {
  const url = `${HOST}${path}?${new URLSearchParams(params)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, { headers: { "X-Api-Key": key, accept: "application/json" }, signal: ctrl.signal });
    if (!res.ok) {
      console.error("Qloo error", res.status, path, (await res.text()).slice(0, 300));
      throw new Error(`Qloo returned ${res.status}`);
    }
    return await res.json();
  } catch (e: any) {
    throw new Error(e?.name === "AbortError" ? "Qloo request timed out" : e?.message || "Qloo request failed");
  } finally {
    clearTimeout(t);
  }
}

export const getStatus = createServerFn({ method: "GET" }).handler(async () => ({
  live: Boolean(process.env["QLOO_API_KEY"]),
}));

export const findCommonGround = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<RunResult> => {
    const key = process.env["QLOO_API_KEY"];
    if (!key || data.forceDemo) return runDemo(data);

    const people = data.people.map((p, i) => ({ ...p, name: p.name || `Person ${i + 1}` }));
    const trace: TraceStep[] = [];
    const warnings: string[] = [];

    // 1. Resolve
    const jobs = people.flatMap((p) => p.interests.map((it) => ({ person: p.name, ...it })));
    const resolved: Resolved[] = await Promise.all(jobs.map(async (j) => {
      const urn = CATEGORIES[j.category].urn;
      const params: Record<string, string> = { query: j.query, take: "1" };
      if (urn) params.types = urn;
      try {
        const r = await qloo("/search", params, key);
        const hit = r?.results?.[0];
        if (!hit?.entity_id) return { ...j, error: "No match found" };
        return { ...j, entityId: hit.entity_id, name: hit.name, type: hit.types?.[0] ?? hit.type };
      } catch (e: any) {
        return { ...j, error: e.message };
      }
    }));
    const ok = resolved.filter((r) => r.entityId);
    trace.push({ stage: "Resolving interests", detail: `GET /search × ${jobs.length} → ${ok.length} matched`, calls: jobs.length, ok: ok.length });

    const contributors = new Set(ok.map((r) => r.person));
    trace.push({ stage: "Mapping taste signals", detail: `${ok.length} entity IDs from ${contributors.size}/${people.length} people → signal.interests.entities`, calls: 0, ok: ok.length });
    if (ok.length === 0) {
      warnings.push("None of the favorites could be resolved in Qloo. Try more specific, well-known names.");
      return { mode: "live", resolved, trace, recommendations: [], plan: [], warnings };
    }

    // 2. Insights per target category
    let targets: Category[] = [...INTENTS[data.intent].targets];
    if (!data.location) {
      if (targets.includes("place")) warnings.push("Add a city to get place/restaurant recommendations.");
      targets = targets.filter((t) => t !== "place");
      if (!targets.length) targets = ["movie", "artist"];
    }
    const ids = [...new Set(ok.map((r) => r.entityId!))].slice(0, 25);
    const byId = new Map<string, Resolved[]>();
    ok.forEach((r) => byId.set(r.entityId!, [...(byId.get(r.entityId!) ?? []), r]));

    let calls = 0, okCalls = 0;
    const recs: Recommendation[] = [];
    await Promise.all(targets.map(async (cat) => {
      const params: Record<string, string> = {
        "filter.type": CATEGORIES[cat].urn!,
        "signal.interests.entities": ids.join(","),
        "feature.explainability": "true",
        take: "8",
      };
      if (cat === "place" && data.location) params["filter.location.query"] = data.location;
      calls++;
      try {
        const r = await qloo("/v2/insights", params, key);
        okCalls++;
        const ents: any[] = r?.results?.entities ?? [];
        for (const e of ents) {
          if (!e?.entity_id || ids.includes(e.entity_id)) continue;
          const affinity = typeof e.query?.affinity === "number" ? e.query.affinity : null;
          const expl: any[] = e.query?.explainability?.["signal.interests.entities"] ?? [];
          const connMap = new Map<string, { person: string; via: string; score: number | null }>();
          for (const x of expl) {
            for (const src of byId.get(x?.entity_id) ?? []) {
              const prev = connMap.get(src.person);
              const score = typeof x.score === "number" ? x.score : null;
              if (!prev || (score ?? 0) > (prev.score ?? 0)) connMap.set(src.person, { person: src.person, via: src.name ?? src.query, score });
            }
          }
          const connects = [...connMap.values()].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
          const coverage = connects.length / people.length;
          const tags: string[] = (e.tags ?? []).map((t: any) => t?.name).filter(Boolean).slice(0, 4);
          const reason = connects.length
            ? `Qloo explainability links this to ${connects.map((c) => c.via).slice(0, 3).join(", ")}${tags.length ? `; tagged ${tags.slice(0, 3).join(", ")}` : ""}.`
            : `Returned by Qloo for the group's combined taste signals${tags.length ? `; tagged ${tags.slice(0, 3).join(", ")}` : ""}. No per-signal explainability returned.`;
          recs.push({
            id: e.entity_id, name: e.name, type: e.type ?? CATEGORIES[cat].urn!, category: categoryFromType(e.type ?? CATEGORIES[cat].urn!),
            affinity, groupScore: (affinity ?? 0.5) * (0.5 + 0.5 * coverage),
            tags, address: e.properties?.address, image: e.properties?.image?.url,
            connects, reason,
          });
        }
      } catch (err: any) {
        warnings.push(`${CATEGORIES[cat].label}: ${err.message}`);
      }
    }));
    const total = recs.length;
    trace.push({ stage: "Finding shared affinities", detail: `GET /v2/insights × ${calls} (${targets.join(", ")}) → ${total} candidates`, calls, ok: okCalls });

    // 3. Shortlist: rank by affinity × group coverage, keep category diversity
    recs.sort((a, b) => b.groupScore - a.groupScore);
    const short: Recommendation[] = [];
    const perCat = new Map<string, number>();
    for (const r of recs) {
      if (short.find((s) => s.id === r.id)) continue;
      const n = perCat.get(r.category) ?? 0;
      if (n >= 3) continue;
      perCat.set(r.category, n + 1);
      short.push(r);
      if (short.length >= 9) break;
    }
    trace.push({ stage: "Assembling shortlist", detail: `Ranked by Qloo affinity × share of group connected → ${short.length} picks`, calls: 0, ok: short.length });
    return { mode: "live", resolved, trace, recommendations: short, plan: composePlan(data, short), warnings };
  });
