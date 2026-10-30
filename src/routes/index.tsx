import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findCommonGround, getStatus } from "@/lib/qloo.functions";
import { DEMO_GROUP, SAMPLE_PROFILES } from "@/lib/demo";
import { CATEGORIES, INTENTS, type Category, type Intent, type Person, type RunResult } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CommonGround — find the overlap in your group's taste" },
      { name: "description", content: "A group cultural discovery agent built on Qloo taste intelligence. Add favorites, get shared picks and a mini-plan." },
      { property: "og:title", content: "CommonGround — find the overlap in your taste" },
      { property: "og:description", content: "Group cultural discovery powered by Qloo taste intelligence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const blank = (n: number): Person => ({ name: `Person ${n}`, interests: [{ query: "", category: "artist" }, { query: "", category: "movie" }] });
const STAGES = ["Resolving interests", "Mapping taste signals", "Finding shared affinities", "Assembling shortlist"];

function Index() {
  const status = useServerFn(getStatus);
  const run = useServerFn(findCommonGround);
  const [live, setLive] = useState<boolean | null>(null);
  const [people, setPeople] = useState<Person[]>([blank(1), blank(2)]);
  const [location, setLocation] = useState("");
  const [intent, setIntent] = useState<Intent>("open");
  const [forceDemo, setForceDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const builderRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => { status().then((s) => setLive(s.live)).catch(() => setLive(false)); }, [status]);

  const update = (i: number, fn: (p: Person) => Person) => setPeople((ps) => ps.map((p, j) => (j === i ? fn(p) : p)));
  const loadDemo = () => {
    setPeople(structuredClone(DEMO_GROUP.people)); setLocation(DEMO_GROUP.location); setIntent(DEMO_GROUP.intent);
    setResult(null); setError(null);
    builderRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const reset = () => { setPeople([blank(1), blank(2)]); setLocation(""); setIntent("open"); setResult(null); setError(null); };

  const cleaned = people.map((p) => ({ ...p, interests: p.interests.filter((it) => it.query.trim()) }));
  const valid = cleaned.length >= 2 && cleaned.every((p) => p.interests.length >= 1);

  const go = async () => {
    if (!valid) { setError("Each person needs at least one favorite."); return; }
    setLoading(true); setError(null); setResult(null); setStage(0);
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, 3)), 1200);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      const r = await run({ data: { people: cleaned, location: location.trim() || undefined, intent, forceDemo } });
      setResult(r);
    } catch (e) {
      console.error(e);
      setError("Something went wrong while contacting the taste engine. Please try again.");
    } finally { clearInterval(timer); setLoading(false); }
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <a href="#" className="font-display text-xl font-semibold">Common<span className="text-primary">Ground</span></a>
        <div className="flex items-center gap-3">
          <StatusPill live={live} forceDemo={forceDemo} />
          <a href="#about" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">Methodology</a>
        </div>
      </header>

      {live === false && (
        <div className="mx-auto max-w-6xl px-5">
          <div className="rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 text-sm">
            <strong>Demo mode.</strong> No <code>QLOO_API_KEY</code> found on the server. Add it in your project's Secrets, then reload to use live Qloo. Results shown now are clearly marked sample data.
          </div>
        </div>
      )}

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pt-24">
        <p className="rise text-sm font-semibold uppercase tracking-[0.2em] text-primary">A group taste agent · powered by Qloo</p>
        <h1 className="rise mt-4 max-w-4xl text-5xl leading-[1.02] sm:text-7xl">Find the overlap in your taste.</h1>
        <p className="rise mt-6 max-w-2xl text-lg text-muted-foreground">
          Everyone adds a few favorite artists, films, books or places. CommonGround reads them through Qloo's taste intelligence and returns picks the whole group is likely to enjoy — with the reasons, and who each one connects.
        </p>
        <div className="rise mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={() => builderRef.current?.scrollIntoView({ behavior: "smooth" })}>Build our common ground</Button>
          <Button size="lg" variant="outline" onClick={loadDemo}>Try demo group</Button>
        </div>
      </section>

      <section ref={builderRef} className="mx-auto max-w-6xl scroll-mt-6 px-5 pb-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl">Your group</h2>
            <p className="text-sm text-muted-foreground">2–5 people · 1–5 favorites each. Nicknames only — no personal data needed.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={loadDemo}>Load demo group</Button>
            <Button variant="ghost" size="sm" onClick={reset}>Reset</Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {people.map((p, i) => (
            <div key={i} className="rise rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Input aria-label="Nickname" value={p.name} maxLength={40} onChange={(e) => update(i, (x) => ({ ...x, name: e.target.value }))} className="font-display text-lg font-semibold" />
                {people.length > 2 && (
                  <Button variant="ghost" size="sm" aria-label="Remove person" onClick={() => setPeople((ps) => ps.filter((_, j) => j !== i))}>✕</Button>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {p.interests.map((it, k) => (
                  <div key={k} className="flex gap-2">
                    <select aria-label="Category" value={it.category} onChange={(e) => update(i, (x) => ({ ...x, interests: x.interests.map((y, m) => (m === k ? { ...y, category: e.target.value as Category } : y)) }))}
                      className="w-28 shrink-0 rounded-md border bg-background px-2 text-xs">
                      {(Object.keys(CATEGORIES) as Category[]).map((c) => <option key={c} value={c}>{CATEGORIES[c].label}</option>)}
                    </select>
                    <Input placeholder="e.g. Radiohead" value={it.query} maxLength={120} onChange={(e) => update(i, (x) => ({ ...x, interests: x.interests.map((y, m) => (m === k ? { ...y, query: e.target.value } : y)) }))} />
                    {p.interests.length > 1 && (
                      <Button variant="ghost" size="sm" aria-label="Remove favorite" onClick={() => update(i, (x) => ({ ...x, interests: x.interests.filter((_, m) => m !== k) }))}>−</Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.interests.length < 5 && (
                  <Button variant="secondary" size="sm" onClick={() => update(i, (x) => ({ ...x, interests: [...x.interests, { query: "", category: "artist" }] }))}>+ Favorite</Button>
                )}
                <select aria-label="Fill from sample profile" defaultValue="" onChange={(e) => { const s = SAMPLE_PROFILES[+e.target.value]; if (s) update(i, (x) => ({ ...x, interests: structuredClone(s.interests) })); e.target.value = ""; }}
                  className="rounded-md border bg-background px-2 text-xs text-muted-foreground">
                  <option value="" disabled>Use a sample profile…</option>
                  {SAMPLE_PROFILES.map((s, j) => <option key={j} value={j}>{s.name}</option>)}
                </select>
              </div>
            </div>
          ))}
          {people.length < 5 && (
            <button onClick={() => setPeople((ps) => [...ps, blank(ps.length + 1)])} className="flex min-h-40 items-center justify-center rounded-xl border-2 border-dashed text-muted-foreground transition hover:border-primary hover:text-primary">
              + Add person
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_2fr]">
          <label className="text-sm">
            <span className="font-semibold">City (optional)</span>
            <Input className="mt-1" placeholder="e.g. New York" value={location} maxLength={80} onChange={(e) => setLocation(e.target.value)} />
            <span className="mt-1 block text-xs text-muted-foreground">Needed for place & restaurant picks.</span>
          </label>
          <div className="text-sm">
            <span className="font-semibold">What are you looking for?</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(INTENTS) as Intent[]).map((k) => (
                <button key={k} onClick={() => setIntent(k)} className={`rounded-full border px-3 py-1.5 text-xs transition ${intent === k ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`}>{INTENTS[k].label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={go} disabled={loading}>{loading ? "Finding…" : "Find our common ground"}</Button>
          {live && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={forceDemo} onChange={(e) => setForceDemo(e.target.checked)} /> Use demo data instead of live Qloo
            </label>
          )}
          {!valid && <span className="text-sm text-muted-foreground">Each person needs at least one favorite.</span>}
        </div>
      </section>

      <section ref={resultRef} className="mx-auto max-w-6xl scroll-mt-6 px-5 pb-16">
        {(loading || result) && <Trace loading={loading} stage={stage} result={result} />}
        {error && (
          <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-5">
            <p className="text-sm">{error}</p>
            <Button className="mt-3" variant="outline" onClick={go}>Try again</Button>
          </div>
        )}
        {result && <Results result={result} onRetry={go} onEdit={() => builderRef.current?.scrollIntoView({ behavior: "smooth" })} />}
      </section>

      <About />
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">CommonGround · built for the Qloo Agentic Hackathon · MIT licensed</footer>
    </div>
  );
}

function StatusPill({ live, forceDemo }: { live: boolean | null; forceDemo: boolean }) {
  const isLive = live && !forceDemo;
  return (
    <span className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${isLive ? "border-success/40 text-success" : "border-warn/50 text-foreground"}`}>
      <span className={`h-2 w-2 rounded-full ${isLive ? "bg-success" : "bg-warn"}`} />
      {live === null ? "Checking…" : isLive ? "Live Qloo" : "Demo data"}
    </span>
  );
}

function Trace({ loading, stage, result }: { loading: boolean; stage: number; result: RunResult | null }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-xl">Agent activity</h3>
      <p className="text-xs text-muted-foreground">Action log of API calls and counts — not hidden reasoning.</p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-4">
        {STAGES.map((s, i) => {
          const step = result?.trace[i];
          const done = !!step || (loading && i < stage);
          const active = loading && i === stage;
          return (
            <li key={s} className={`rounded-lg border p-3 text-sm transition ${active ? "border-primary bg-accent" : done ? "" : "opacity-50"}`}>
              <div className="flex items-center gap-2 font-semibold">
                <span className={`h-2 w-2 rounded-full ${active ? "animate-pulse bg-primary" : done ? "bg-success" : "bg-muted-foreground"}`} />{s}
              </div>
              {step && <p className="mt-1 text-xs text-muted-foreground">{step.detail}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Results({ result, onRetry, onEdit }: { result: RunResult; onRetry: () => void; onEdit: () => void }) {
  const demo = result.mode === "demo";
  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl">Your common ground</h2>
          <p className="text-sm text-muted-foreground">{demo ? "Demo data — sample fixtures, not Qloo output." : "Live results from Qloo Insights, ranked by affinity × share of the group connected."}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>Edit group</Button>
          <Button variant="outline" size="sm" onClick={onRetry}>Run again</Button>
        </div>
      </div>

      {result.warnings.map((w) => <p key={w} className="mt-3 rounded-md bg-warn/10 px-3 py-2 text-xs">{w}</p>)}

      {!demo && (
        <details className="mt-4 rounded-lg border bg-card p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Resolved interests ({result.resolved.filter((r) => r.entityId).length}/{result.resolved.length})</summary>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {result.resolved.map((r, i) => (
              <li key={i} className="text-xs"><span className="font-semibold">{r.person}:</span> “{r.query}” → {r.entityId ? <span className="text-success">{r.name}</span> : <span className="text-destructive">{r.error}</span>}</li>
            ))}
          </ul>
        </details>
      )}

      {result.recommendations.length === 0 ? (
        <div className="mt-6 rounded-xl border bg-card p-8 text-center">
          <p>No shared recommendations came back.</p>
          <p className="mt-1 text-sm text-muted-foreground">Try well-known names, add a city, or pick a broader intent.</p>
          <Button className="mt-4" variant="outline" onClick={onRetry}>Try again</Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.recommendations.map((r, i) => (
            <article key={r.id} className="rise flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm" style={{ animationDelay: `${i * 60}ms` }}>
              {r.image && <img src={r.image} alt="" className="h-40 w-full object-cover" loading="lazy" />}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">{CATEGORIES[r.category].label}</span>
                  <span className={demo ? "font-semibold text-warn" : "text-muted-foreground"}>{demo ? "DEMO" : r.affinity !== null ? `Qloo affinity ${r.affinity.toFixed(2)}` : "affinity n/a"}</span>
                </div>
                <h3 className="mt-2 text-xl leading-tight">{r.name}</h3>
                {r.address && <p className="text-xs text-muted-foreground">{r.address}</p>}
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why this fits the group</p>
                <p className="text-sm">{r.reason}</p>
                {r.connects.length > 0 && (
                  <>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Who it connects</p>
                    <ul className="mt-1 flex flex-wrap gap-1">
                      {r.connects.map((c) => (
                        <li key={c.person} className="rounded-md border px-2 py-0.5 text-xs"><strong>{c.person}</strong> via {c.via}{c.score !== null ? ` · ${c.score.toFixed(2)}` : ""}</li>
                      ))}
                    </ul>
                  </>
                )}
                {r.tags.length > 0 && <p className="mt-auto pt-3 text-xs text-muted-foreground">{r.tags.join(" · ")}</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      {result.plan.length > 0 && (
        <div className="mt-8 rounded-xl border-l-4 border-primary bg-card p-5">
          <h3 className="text-2xl">Mini-plan</h3>
          <p className="text-xs text-muted-foreground">Template-generated summary of the {demo ? "demo" : "Qloo"} results above — written by CommonGround, not Qloo output.</p>
          <ol className="mt-3 space-y-1 text-sm">
            {result.plan.map((l, i) => <li key={i} className={i === 0 ? "font-semibold" : ""}>{i > 0 ? `${i}. ` : ""}{l}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}

function About() {
  return (
    <section id="about" className="border-t bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3">
        <div>
          <h2 className="text-3xl">Methodology</h2>
          <p className="mt-2 text-sm text-muted-foreground">How CommonGround reasons — transparently.</p>
        </div>
        <div className="space-y-3 text-sm md:col-span-2">
          <p><strong>Taste intelligence.</strong> Qloo models cross-domain cultural affinity — how liking one artist, film or place relates to others. Each favorite is resolved to a Qloo entity via <code>/search</code>, then all resolved entities become signals for <code>/v2/insights</code>.</p>
          <p><strong>Group ranking.</strong> Candidates are ranked by Qloo's returned affinity, weighted by how many people's favorites Qloo's explainability links to the candidate. That's a heuristic, not exact mathematical consensus.</p>
          <p><strong>Affinity, not guarantees.</strong> Results reflect likely enjoyment based on aggregate cultural patterns.</p>
          <p><strong>Privacy.</strong> No names, emails, or accounts. Optional nicknames stay in your browser session and are only used to label contributions.</p>
          <p><strong>No LLM.</strong> Orchestration and the mini-plan are deterministic code over Qloo data.</p>
        </div>
      </div>
    </section>
  );
}
