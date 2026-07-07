# Relay — Design Spec

> Working codename: **Relay** (domain-neutral, reskinnable; rename anytime).
> Date: 2026-07-07 · Status: Design locked, pending user review → writing-plans.

## One-line

An accessible-by-default, AI-assisted ITSM request tool — a *minified ideal ServiceNow* — where one plain-language box replaces the confusing intake, Claude classifies and structures the input into correctly-typed records, and a single consolidated workspace kills the REQ→RITM→SCTASK three-page navigation tax. Reskinnable across an entire employer funnel by swapping data, not code.

## Why this project exists (strategic frame)

This is **flagship #1 of two** (the second — a game-companion app — is a separate, later project and explicitly NOT in this spec). It proves the user's edge: *"IT/enterprise operator who now ships, with AI as leverage."* It is built against a **category** (AI-leverage tooling for unsexy IT/ops workflows), not a single company, and is **reskinned per application** in ~30 minutes — resume, not cover letter.

The design is grounded in the user's lived pain as a daily ServiceNow user on a school-district service desk that runs an ITSM never configured for the team's actual workflow.

## The pains it kills (all real, all the user's lived experience)

1. **Intake confusion.** Users get lost choosing a ticket type / navigating the catalog. → **One plain-language box.** The user never picks a type.
2. **Request fragmentation.** One logical request is shattered across three pages — **REQ** (the request) → **RITM** (each requested item) → **SC Catalog Task / SCTASK** (fulfillment tasks under a RITM). Working one request means multiple page loads, scattered context, clicks tax. → **One consolidated workspace** showing the whole tree, actionable inline.
3. **Weak search.** Fuzzy search underperforms. → **AI semantic deflection** at the intake box (built last; see Scope).
4. **Inaccessibility.** The current tool is hostile to assistive tech. → **Keyboard- and screen-reader-first**, with a low-vision teammate as the north-star user. Public sector = real Section 508 / WCAG obligations, which is also a hiring signal for the user's fallback funnel (established-org internal-tools teams).

## Users (both sides, one flow)

- **Requester (submission side):** an end user (teacher, staff) describes a need or problem in plain language; AI turns it into correctly-formed records so they never touch the ugly catalog.
- **Fulfiller / service-desk agent (fulfillment side):** the user and teammates; the AI-structured request lands in a **decluttered, consolidated workspace** where the whole REQ/RITM/SCTASK tree is visible and actionable on one page.

## The AI capabilities (all load-bearing — no AI-washing)

The AI is the engine, not garnish. Three capabilities, two distinct in-demand patterns (structured generation + semantic retrieval):

1. **Classify intent** — incident (something broken) vs. request (I need something) — and route to the correct record type. This is the "right front door" capability and the piece that *generalizes* (classify + route is the transferable skill for any future skin).
2. **Decompose & structure** — turn a request into a REQ with the correct RITMs, infer field values it can, and **ask only for genuinely-missing required info** via a short clarification loop. Incidents get created with AI-extracted fields (summary, category, urgency, affected item) — **classified and routed only; no incident management.**
3. **Semantic deflection** — at the intake box, semantically search the KB and surface relevant articles *before* a ticket is created. Adds the buyer-loved "deflection" metric and a second AI pattern. **Built last** — the clean cut-line if time runs short.

Implementation detail (mechanism, tool-use vs. structured output, model choice) is deferred to the plan phase and will be pinned using the `claude-api` skill. The Claude key lives **server-side only** (Next.js API route), never in the client.

## Accessibility approach (the differentiator)

- Built on **React Aria Components** (Adobe) — chosen because correct a11y (focus management, keyboard interaction, screen-reader announcements, ARIA) is brutally easy to get subtly wrong by hand, and React Aria removes the footguns so the a11y is real, not aspirational. "Built on React Aria" is also the strongest possible interview answer to "how did you handle accessibility."
  - **Pre-approved fallback:** `base-ui` (which the user already knows) if React Aria velocity stalls badly. Shipping beats perfect.
- Keyboard-first and screen-reader-first throughout; customizable shortcuts and high-contrast / adjustable display for the low-vision north-star user.
- The **consolidated single-page workspace is itself an a11y win** — one page instead of three means far fewer navigation stops for a screen-reader user.

## Architecture

- **Framework:** Next.js + TypeScript, single repo (fullstack in one place).
- **AI:** Claude API, called from a server-side API route (key never client-side).
- **UI:** React Aria Components.
- **Persistence:** lightweight DB — choice (Supabase/Postgres vs. SQLite for the demo) deferred to plan time.
- **Deploy:** Vercel (the user's known path).

### The reskin seam (HARD REQUIREMENT — this is what makes it the go-to portfolio project)

The **catalog of requestable items, the record schema, the fulfillment hierarchy, and branding all live as DATA / config** (e.g., `catalog.json` + a branding config), *not* code. The engine — intake AI, consolidated workspace, accessibility — is **domain-agnostic** and never edited per application.

Reskin playbook, per job application:
1. Swap the catalog/schema data to the target's domain.
2. Swap branding.
3. Write **one** demo scenario drawn from the target's actual public pain (G2/Capterra reviews).

Same engine serves the whole funnel:

| Applying to… | Swap the catalog to… |
|---|---|
| B2B SaaS for unsexy ops / ServiceNow-adjacent | keep the ITSM skin — native |
| Facilities / ops SaaS | repairs, room bookings, access requests |
| HR-tech / internal-tools team | onboarding, offboarding, PTO, equipment |
| Procurement / RevOps | purchase requests, deal-desk intake |

## Data model (the slice)

- **Incident** — standalone (broken thing). Created + routed; no management workflow.
- **Request (REQ)** — top-level request record.
  - **RequestItem (RITM)** — each requested item under a REQ (1..n).
    - **CatalogTask (SCTASK)** — fulfillment tasks under a RITM (0..n).
- **CatalogItem** + field definitions — **config/data**, the reskin surface.
- **KB Article** — small demo set, used for semantic deflection.

## Data flow

1. User types plain-language input into the intake box.
2. Server-side API route sends input + catalog schema to Claude.
3. **(Deflection, phase-last)** Semantic search over KB; surface relevant articles; user may resolve without a ticket.
4. Claude returns structured output: record type (incident vs. request), matched catalog items, inferred field values, and what's still missing.
5. Clarification loop for missing required fields (minimal, only what's genuinely needed).
6. Records created (REQ + RITMs [+ SCTASKs], or an incident) and persisted.
7. Fulfiller opens the **consolidated workspace** — full tree on one page, inline actions.

## Error handling

- **AI returns malformed / low-confidence structure:** validate against the catalog schema server-side; on failure, fall back to a graceful "let me confirm the details" clarification path rather than creating a bad record. Never silently create garbage.
- **Missing required fields:** the clarification loop is the designed path, not an error.
- **AI/API unavailable:** the intake still degrades to a manual structured form (accessible) so the app is never fully blocked by the model.
- **Semantic search miss:** simply create the ticket (deflection is additive, never a gate).

## Testing / "Done" = demo-ready

- **Two scripted scenarios end-to-end:** (a) a multi-item onboarding **request** decomposing into multiple RITMs; (b) an **incident**. Plus a live **deflection** example (an article surfaced at intake).
- Deployed to Vercel.
- Passes an **axe / Lighthouse** accessibility audit.
- Passes a **full keyboard walkthrough** and a **screen-reader walkthrough**.
- Phase-2 list documented in-repo.

## Explicitly OUT of scope (phase 2+ — named so they're conscious, not lost)

- KB **authoring / approval / browse** module (overlaps the user's existing `kb-helper` and `knowflow` projects — do not rebuild).
- Approvals / SLAs, change / problem / CMDB.
- Real ServiceNow integration.
- AI-learned decluttered-config recommender.
- Real auth / RBAC beyond a demo toggle.
- Performance/load-time tuning (real annoyance, but not an AI story).

## Open items for the plan phase

- Persistence choice (Supabase/Postgres vs. SQLite for demo).
- Exact Claude mechanism (tool use vs. structured output) — pin via `claude-api` skill.
- Semantic search implementation at demo scale (embeddings + similarity vs. small-set in-context) — keep minimal.
- The synthetic school-district catalog + the small KB article set.

## Decisions locked this session (provenance)

- Two flagships total; **build this IT/ops tool FIRST**, ship fully, then the game-companion app (separate session).
- Core = Smart Request Intake + consolidated workspace; a11y-first; district skin.
- Users = both requester + fulfiller, one flow.
- Front door = includes lightweight **incident classification** (not just requests).
- KB = **semantic deflection only** folded in (built last); authoring/cleanup stays OUT (overlaps `kb-helper`/`knowflow`).
- Stack = Next.js + TS + Claude (server-side) + React Aria + Vercel.
- Name = working codename "Relay"; user undecided, rename freely.
