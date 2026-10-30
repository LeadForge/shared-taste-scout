# CommonGround — Devpost submission notes

Use this file as the source for the Devpost submission fields. Keep all claims consistent with the running product.

## Submission links

- **Project title:** CommonGround
- **Tagline:** Find the overlap in your group's taste.
- **Live demo:** https://shared-taste-scout.lovable.app
- **Public source repository:** https://github.com/LeadForge/shared-taste-scout
- **License:** MIT
- **Platform:** Web application built and hosted with Lovable (TypeScript, React, TanStack Start, Vite, Tailwind CSS).
- **Qloo API:** Qloo Hackathon API; server-side requests use `X-Api-Key` and the project secrets `QLOO_API_KEY` and `QLOO_API_BASE_URL`.

## Short description

CommonGround is a group cultural discovery agent that finds the overlap in the tastes of friends, couples, families, and teams. Each person adds a few favorite artists, films, books, places, brands, or games. CommonGround uses Qloo's cross-domain taste intelligence to turn those individual signals into a shared, explainable shortlist and a lightweight plan.

## Full project description

Choosing something everyone in a group will enjoy is often harder than finding something any one person likes. Music, film, food, books, and places are connected by cultural taste, but group decisions usually rely on guesswork or the loudest opinion.

CommonGround makes that decision more thoughtful. A group of two to five people adds a few cultural favorites, chooses an optional city and discovery intent, and asks CommonGround to find the overlap. The app resolves those favorites to Qloo entities, combines the resulting entity IDs into group taste signals, and queries Qloo Insights for recommendations across relevant categories. It uses returned affinity and explainability information when available to rank a shortlist and show which participants' interests connect to each recommendation. A small, transparent action log shows the stages of the workflow, and CommonGround composes a simple mini-plan from the selected results.

The result is not a popularity list or a claim that every participant will like the same thing. It is a group-aware discovery aid grounded in Qloo's cultural affinity data. Explainability is shown when the API returns it; group ranking is a clearly described heuristic rather than a mathematically exact consensus score.

CommonGround is implemented as a task-specific agentic workflow: resolve interests → map taste signals → discover cross-domain affinities → rank and diversify candidates → assemble a plan. The orchestration is deterministic TypeScript using live Qloo API responses. It does not claim to use an LLM or an external agent framework.

The web app is hosted on Lovable, while the public GitHub repository includes the source code, MIT license, local installation guide, and Lovable deployment notes. A clearly labelled demo mode allows judges to explore the product without providing their own Qloo credentials; demo fixtures are not presented as live Qloo output.

## Key features

- Group builder for 2–5 people with optional nicknames.
- Support for artists/music, movies/TV, books, places/restaurants, brands, videogames, and other interests.
- Optional city and discovery intent (food, culture, date night, weekend, entertainment, or open discovery).
- Server-side Qloo entity resolution through `/search`.
- Group recommendations through `/v2/insights` using `signal.interests.entities`.
- Affinity-aware ranking, explainability-based connections when available, and a transparent activity trace.
- A mini-plan assembled from recommendations.
- Clearly labelled demo data when live credentials are unavailable or demo mode is selected.

## How the project uses Qloo

1. Each submitted favorite is resolved to a Qloo entity using the Qloo Hackathon API's `/search` endpoint.
2. The resolved entity IDs are combined as `signal.interests.entities`.
3. CommonGround requests relevant recommendation categories through `/v2/insights`, optionally applying a location filter for place recommendations.
4. Returned affinity and explainability data, when present, inform recommendation ranking and the participant connections shown in the UI.
5. The app creates a shortlist and a simple plan from the returned recommendations.

Qloo credentials are read only by server-side handlers and are not embedded in browser code. No Qloo API key is included in the repository.

## Agentic workflow

CommonGround is a purpose-built agentic tool for group cultural discovery. Its orchestrated, multi-stage task flow does more than display a static list: it resolves unstructured favorites, assembles group-level taste signals, requests category-specific insights, interprets affinity/explainability data, applies a group-coverage ranking heuristic, and builds a plan. The interface displays a concise action log of these stages. It is not an autonomous general-purpose agent and does not use an LLM in the current implementation.

## Impact and intended users

The primary users are friends, couples, families, and small groups planning a shared outing or activity. The product targets a familiar coordination problem: individual tastes differ, while the group still needs a choice that feels relevant to everyone. CommonGround offers a privacy-conscious starting point because it does not require accounts, emails, or identity data; optional nicknames are used only to identify contributions in the result.

## Testing instructions for judges

1. Open the live demo: https://shared-taste-scout.lovable.app
2. Use **Try demo group** to load a ready-made group.
3. Select **Find our common ground** to see the activity trace, recommendation cards, participant connections, and mini-plan.
4. Demo results are explicitly labelled as demo fixtures. The hosted production app has server-side Qloo credentials configured; the live status indicator and a fresh run should be used to inspect live Qloo output.
5. Judges do not need to install the application or provide credentials to explore the hosted demo.

For source installation, follow the root [README.md](./README.md). It uses Node.js and Bun, not Laravel. Lovable hosting details are in [README-LOVABLE.md](./README-LOVABLE.md).

## Rules checklist

The official rules at https://qloo.devpost.com/rules require:

- A working application that integrates the Qloo API and functions as an agentic tool, uses an agent framework, or integrates Qloo into an existing agent.
- A functional demo application link.
- A public code repository containing the source, assets, and setup instructions.
- An open-source license file.
- An English project description.
- Free, unrestricted access for judges through the end of the judging period.

Before submitting, confirm the live demo opens without a login wall, the Qloo status indicates a verified live connection, and the repository's About section displays the MIT license. Keep the app publicly accessible through the judging period.

## Important accuracy notes

- The hosted application is built and hosted with **Lovable**. It is **not Laravel**.
- The repository's core application uses TypeScript, React, TanStack Start, Vite, and Tailwind CSS.
- The agent orchestration is deterministic TypeScript, not an LLM-powered agent or agent-framework implementation.
- Demo fixtures are illustrative samples, not Qloo responses.
