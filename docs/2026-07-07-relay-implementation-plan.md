# Relay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Relay MVP — an accessible-by-default AI ITSM intake tool where one plain-language box classifies + structures a request or incident, and a consolidated workspace shows the whole REQ/RITM/SCTASK tree on one page.

**Architecture:** Next.js (App Router) + TypeScript single repo. A server-side API route calls Claude (`messages.parse()` with a JSON schema) to turn plain-language input + the catalog schema into a typed, validated record set. A thin data layer (interface + in-memory impl for tests, Supabase impl for the demo) persists records. React Aria Components render both the requester intake and the fulfiller workspace to a high a11y bar. Catalog + branding live as config so the app reskins by data swap.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · `@anthropic-ai/sdk` · React Aria Components · Zod · Supabase (`@supabase/supabase-js`) · Vitest · Playwright + axe-core · Vercel.

## Global Constraints

- **Claude model:** `claude-opus-4-8` (verified current). Haiku/Sonnet are a cost/latency lever — change only if the user explicitly asks.
- **Claude key is server-side only** — read `process.env.ANTHROPIC_API_KEY` inside API route handlers / server modules; never import the Anthropic SDK into a client component.
- **Structured output:** use `client.messages.parse({ ..., output_config: { format: zodOutputFormat(Schema) } })` — do NOT use assistant-message prefills (400 on Opus 4.8) and do NOT use the deprecated top-level `output_format`.
- **Reskin seam is load-bearing:** catalog items, their fields, the record hierarchy, and branding are DATA in `config/`, never hard-coded in engine modules. No engine module imports district-specific strings.
- **Accessibility is a gate, not a garnish:** every interactive element is keyboard-reachable and screen-reader-labelled via React Aria; the final `axe` pass must be clean.
- **Scope:** request lifecycle (intake → REQ/RITM/SCTASK workspace) + lightweight incident classification. Everything in the spec's "OUT of scope" list stays out.

---

## File Structure

```
relay/
  config/
    catalog.ts          # CatalogItem[] + field defs (the reskin surface) — DATA
    branding.ts         # name, colors, copy (the reskin surface) — DATA
    kb-articles.ts      # small KB set for deflection (Phase 7) — DATA
  src/
    domain/
      types.ts          # Incident, Request(REQ), RequestItem(RITM), CatalogTask(SCTASK), CatalogItem
      schema.ts         # Zod schemas: catalog schema + AI intake output shape
    engine/
      intake.ts         # buildIntakePrompt(input, catalog) + parseIntake(): the Claude call
      assemble.ts       # intakeResult -> persisted record tree (REQ+RITMs[+SCTASKs] | Incident)
      validate.ts       # validateAgainstCatalog(): required-field / missing-info detection
    data/
      store.ts          # RecordStore interface
      memory-store.ts   # in-memory impl (tests + local dev)
      supabase-store.ts # Supabase impl (demo/prod)
    app/
      api/intake/route.ts    # POST: text -> intakeResult (calls engine/intake)
      api/records/route.ts   # POST create tree, GET list; /[id] GET one
      page.tsx               # requester intake screen
      workspace/page.tsx     # fulfiller queue
      workspace/[reqId]/page.tsx  # consolidated REQ/RITM/SCTASK view
    components/
      IntakeBox.tsx          # React Aria TextField + submit + clarification loop
      ClarifyDialog.tsx      # asks only-missing required fields
      RequestTree.tsx        # REQ header -> RITM cards -> SCTASK checklist, one page
      a11y/                  # shared accessible primitives (buttons, fields)
  tests/
    engine/*.test.ts
    data/*.test.ts
    e2e/*.spec.ts            # Playwright + axe
```

**Decomposition rationale:** `engine/` is pure logic (no React, no Next) so it's unit-testable in isolation and reused by any UI. `data/` hides persistence behind `RecordStore` so tests run in-memory and the Supabase choice never leaks into the engine. `config/` is the only place district-specific data lives.

---

## Phase 0 — Scaffold

### Task 0: Project scaffold + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.env.local.example`, `.gitignore`
- Create: `src/app/layout.tsx`, `src/app/page.tsx` (placeholder)

- [ ] **Step 1:** `npx create-next-app@latest relay --typescript --app --no-tailwind` (or scaffold manually if the user prefers). Confirm dev server boots.
- [ ] **Step 2:** Install deps: `npm i @anthropic-ai/sdk react-aria-components zod @supabase/supabase-js` and dev: `npm i -D vitest @vitest/coverage-v8 playwright @axe-core/playwright`.
- [ ] **Step 3:** Add `.env.local.example` with `ANTHROPIC_API_KEY=` and `SUPABASE_URL=` / `SUPABASE_ANON_KEY=` placeholders. Confirm `.env.local` is gitignored.
- [ ] **Step 4:** Add `vitest.config.ts` (node environment for engine/data tests). Add `"test": "vitest run"` script.
- [ ] **Step 5:** Run `npm run dev` and `npm test` (0 tests) — both succeed.
- [ ] **Step 6:** Commit: `chore: scaffold Next.js + TS + testing`.

**Gate:** dev server serves the placeholder page; test runner runs.

---

## Phase 1 — Domain + Data

### Task 1: Domain types

**Files:**
- Create: `src/domain/types.ts`
- Test: `tests/domain/types.test.ts`

**Interfaces produced (later tasks depend on these exact names):**
```ts
export type FieldType = "text" | "select" | "number" | "date";
export interface CatalogField { key: string; label: string; type: FieldType; required: boolean; options?: string[]; }
export interface CatalogItem { id: string; name: string; description: string; fields: CatalogField[]; }

export interface CatalogTask { id: string; ritmId: string; label: string; done: boolean; }
export interface RequestItem { id: string; reqId: string; catalogItemId: string; values: Record<string, string>; tasks: CatalogTask[]; }
export interface Request { id: string; summary: string; items: RequestItem[]; createdAt: string; }
export interface Incident { id: string; shortDescription: string; category: string; urgency: "low" | "medium" | "high"; affectedItem: string; createdAt: string; }

export type RecordTree = { kind: "request"; request: Request } | { kind: "incident"; incident: Incident };
```

- [ ] **Step 1: failing test** — assert a hand-built `Request` with one `RequestItem` and two `CatalogTask`s type-checks and its shape round-trips through `JSON.stringify/parse`.
```ts
import { describe, it, expect } from "vitest";
import type { Request } from "../../src/domain/types";
it("request tree holds RITMs and SCTASKs", () => {
  const r: Request = { id: "REQ1", summary: "onboarding", createdAt: "t",
    items: [{ id: "RITM1", reqId: "REQ1", catalogItemId: "laptop", values: { model: "MB Air" },
      tasks: [{ id: "SCT1", ritmId: "RITM1", label: "image laptop", done: false }] }] };
  expect(JSON.parse(JSON.stringify(r)).items[0].tasks[0].label).toBe("image laptop");
});
```
- [ ] **Step 2:** Run `npx vitest run tests/domain` → FAIL (module missing).
- [ ] **Step 3:** Write `src/domain/types.ts` with the interfaces above.
- [ ] **Step 4:** Run test → PASS.
- [ ] **Step 5:** Commit: `feat(domain): record types`.

### Task 2: Catalog config + Zod schemas

**Files:**
- Create: `config/catalog.ts`, `src/domain/schema.ts`
- Test: `tests/domain/schema.test.ts`

**Interfaces produced:**
```ts
export const catalog: CatalogItem[];               // config/catalog.ts
export const IntakeResultSchema: z.ZodType<IntakeResult>;  // schema.ts
export type IntakeResult =
  | { kind: "request"; summary: string; items: { catalogItemId: string; values: Record<string,string>; missing: string[] }[] }
  | { kind: "incident"; shortDescription: string; category: string; urgency: "low"|"medium"|"high"; affectedItem: string };
```

- [ ] **Step 1:** Write `config/catalog.ts` — a synthetic school-district catalog: `laptop`, `district-email`, `sis-access`, `classroom-software-bundle`, each with 2–4 fields (some required). This is DATA; no logic.
- [ ] **Step 2: failing test** — `IntakeResultSchema.parse(validRequestObj)` succeeds and `.parse(badObj)` throws.
- [ ] **Step 3:** Run → FAIL.
- [ ] **Step 4:** Write `src/domain/schema.ts` with `IntakeResultSchema` (a Zod discriminated union on `kind`).
- [ ] **Step 5:** Run → PASS. Commit: `feat(config): district catalog + intake schema`.

### Task 3: RecordStore interface + in-memory impl

**Files:**
- Create: `src/data/store.ts`, `src/data/memory-store.ts`
- Test: `tests/data/memory-store.test.ts`

**Interfaces produced:**
```ts
export interface RecordStore {
  saveTree(tree: RecordTree): Promise<string>;   // returns REQ or INC id
  getRequest(id: string): Promise<Request | null>;
  listRequests(): Promise<Request[]>;
  toggleTask(taskId: string): Promise<void>;
}
export function createMemoryStore(): RecordStore;
```

- [ ] **Step 1: failing test** — save a request tree, `getRequest` returns it; `toggleTask` flips `done`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `createMemoryStore()` over a `Map`.
- [ ] **Step 4:** Run → PASS. Commit: `feat(data): RecordStore + memory impl`.

---

## Phase 2 — AI Intake (load-bearing)

### Task 4: Intake prompt builder

**Files:**
- Create: `src/engine/intake.ts` (prompt half)
- Test: `tests/engine/prompt.test.ts`

**Interfaces produced:**
```ts
export function buildIntakeSystemPrompt(catalog: CatalogItem[]): string;
```

- [ ] **Step 1: failing test** — the prompt contains every catalog item id and instructs the model to (a) decide incident vs request, (b) match catalog items, (c) infer field values, (d) list genuinely-missing required fields in `missing`.
```ts
it("prompt lists catalog ids and both branches", () => {
  const p = buildIntakeSystemPrompt(catalog);
  expect(p).toContain("laptop");
  expect(p.toLowerCase()).toContain("incident");
  expect(p.toLowerCase()).toContain("missing");
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `buildIntakeSystemPrompt` — serialize the catalog (ids, names, fields, which are required) into an instruction block. Pure string; no network.
- [ ] **Step 4:** Run → PASS. Commit: `feat(engine): intake prompt builder`.

### Task 5: Claude intake call

**Files:**
- Modify: `src/engine/intake.ts`
- Test: `tests/engine/intake.test.ts` (mock the SDK)

**Interfaces produced:**
```ts
export async function runIntake(input: string, deps?: { client?: Anthropic }): Promise<IntakeResult>;
```

- [ ] **Step 1: failing test** — inject a fake client whose `messages.parse` resolves `{ parsed_output: <valid IntakeResult> }`; assert `runIntake("need a laptop for a new hire")` returns that object. Assert the call used `model: "claude-opus-4-8"` and `output_config.format`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement:
```ts
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { IntakeResultSchema } from "../domain/schema";
import { catalog } from "../../config/catalog";

export async function runIntake(input: string, deps: { client?: Anthropic } = {}): Promise<IntakeResult> {
  const client = deps.client ?? new Anthropic(); // reads ANTHROPIC_API_KEY server-side
  const res = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },          // tunable; drop for lower latency
    system: buildIntakeSystemPrompt(catalog),
    output_config: { format: zodOutputFormat(IntakeResultSchema) },
    messages: [{ role: "user", content: input }],
  });
  if (!res.parsed_output) throw new Error("intake_unparseable");
  return res.parsed_output;
}
```
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit: `feat(engine): Claude structured intake`.

**Note for implementer:** verify `zodOutputFormat` import path against the installed `@anthropic-ai/sdk` version (`typescript/claude-api/tool-use.md` in the claude-api skill shows `@anthropic-ai/sdk/helpers/zod`). If the SDK rejects `thinking` + `output_config` together on your version, drop `thinking`.

### Task 6: Assemble tree + validate

**Files:**
- Create: `src/engine/assemble.ts`, `src/engine/validate.ts`
- Test: `tests/engine/assemble.test.ts`, `tests/engine/validate.test.ts`

**Interfaces produced:**
```ts
export function validateAgainstCatalog(r: IntakeResult, catalog: CatalogItem[]): string[]; // returns still-missing required field keys
export function assembleTree(r: IntakeResult, ids: () => string): RecordTree;               // IntakeResult -> RecordTree with generated ids + default SCTASKs per catalog item
```

- [ ] **Step 1: failing tests** — (a) `validateAgainstCatalog` returns `["startDate"]` when a required field is absent from `values`; (b) `assembleTree` on a request produces a REQ with one RITM per item and the catalog item's default SCTASKs.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement both (pure functions).
- [ ] **Step 4:** Run → PASS. Commit: `feat(engine): assemble + validate`.

---

## Phase 3 — API routes

### Task 7: `/api/intake`

**Files:**
- Create: `src/app/api/intake/route.ts`
- Test: `tests/engine/intake.test.ts` already covers the engine; add `tests/api/intake.test.ts` calling the route handler with a mocked `runIntake`.

**Interface:** `POST /api/intake { text } -> { result: IntakeResult, missing: string[] }`

- [ ] **Step 1: failing test** — POST returns `result` + `missing` from a stubbed engine; empty body → 400.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement the route: parse body, call `runIntake`, run `validateAgainstCatalog`, return both. Key stays server-side (route runs on the server).
- [ ] **Step 4:** Run → PASS. Commit: `feat(api): intake route`.

### Task 8: `/api/records`

**Files:**
- Create: `src/app/api/records/route.ts`, `src/app/api/records/[id]/route.ts`
- Test: `tests/api/records.test.ts` (inject memory store)

**Interface:** `POST /api/records { result } -> { id }` (assembles + saves); `GET /api/records -> Request[]`; `GET /api/records/[id] -> Request`.

- [ ] **Step 1: failing test** — POST an IntakeResult, GET the id back with its RITM/SCTASK tree.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement using `assembleTree` + a store. Provide the store via a small `getStore()` factory so tests inject memory and prod uses Supabase.
- [ ] **Step 4:** Run → PASS. Commit: `feat(api): records CRUD`.

### Task 9: Supabase store

**Files:**
- Create: `src/data/supabase-store.ts`, `supabase/schema.sql`
- Test: `tests/data/supabase-store.test.ts` (skipped unless `SUPABASE_URL` set)

- [ ] **Step 1:** Write `supabase/schema.sql` — tables `requests`, `request_items`, `catalog_tasks`, `incidents`. Run it in the Supabase project.
- [ ] **Step 2:** Implement `createSupabaseStore()` satisfying `RecordStore`.
- [ ] **Step 3:** Add an integration test guarded by env; run it once against the real project to confirm a round-trip.
- [ ] **Step 4:** Wire `getStore()` to pick Supabase when env is present, memory otherwise. Commit: `feat(data): supabase store`.

---

## Phase 4 — Requester UI (a11y-first)

### Task 10: IntakeBox

**Files:**
- Create: `src/components/IntakeBox.tsx`, `src/app/page.tsx`
- Test: `tests/e2e/intake.spec.ts` (Playwright)

- [ ] **Step 1: failing e2e** — load `/`, type a request into the labelled textbox, submit, see a structured preview (matched items + any missing-field prompts). Run → FAIL.
- [ ] **Step 2:** Build `IntakeBox` with React Aria `TextField`/`Label`/`Button`; POST to `/api/intake`; render the returned `result`.
- [ ] **Step 3:** Run → PASS.
- [ ] **Step 4:** Commit: `feat(ui): intake box`.

**Implementer note:** use React Aria Components (`TextField`, `Label`, `Input`, `Button`, `Form`); verify current prop names against React Aria docs. Every field needs an associated `<Label>`.

### Task 11: Clarification loop

**Files:**
- Create: `src/components/ClarifyDialog.tsx`
- Test: extend `tests/e2e/intake.spec.ts`

- [ ] **Step 1: failing e2e** — a request with a missing required field surfaces a dialog asking ONLY that field; filling it and confirming POSTs to `/api/records` and shows a confirmation with the new REQ id. Run → FAIL.
- [ ] **Step 2:** Build `ClarifyDialog` with React Aria `Dialog`/`Modal` (focus trap + `aria` handled by the library); render one field per entry in `missing`.
- [ ] **Step 3:** Run → PASS. Commit: `feat(ui): clarification loop`.

---

## Phase 5 — Fulfiller workspace

### Task 12: Queue

**Files:** Create `src/app/workspace/page.tsx`; Test `tests/e2e/workspace.spec.ts`.
- [ ] **Step 1: failing e2e** — `/workspace` lists submitted requests (summary + item count), each a keyboard-focusable link. Run → FAIL → implement (GET `/api/records`, React Aria `GridList`/links) → PASS → commit `feat(ui): fulfiller queue`.

### Task 13: Consolidated RequestTree

**Files:** Create `src/components/RequestTree.tsx`, `src/app/workspace/[reqId]/page.tsx`; Test extend `workspace.spec.ts`.
- [ ] **Step 1: failing e2e** — open one request; the SINGLE page shows REQ header, each RITM as a card, and its SCTASKs as a checkbox list; toggling a SCTASK persists (reload shows the new state). Run → FAIL.
- [ ] **Step 2:** Build `RequestTree` (REQ → RITM cards → React Aria `Checkbox` per SCTASK, wired to `PATCH`/`toggleTask`). One page, no navigation between records — this is the anti-three-page-tax win.
- [ ] **Step 3:** Run → PASS. Commit: `feat(ui): consolidated request workspace`.

---

## Phase 6 — Accessibility gate + demo data

### Task 14: axe audit + keyboard/SR pass

**Files:** Create `tests/e2e/a11y.spec.ts`.
- [ ] **Step 1:** Add `@axe-core/playwright` checks to `/`, `/workspace`, `/workspace/[reqId]` — assert zero violations. Run → fix any violations (labels, roles, contrast, focus order) until clean.
- [ ] **Step 2:** Manual pass documented in `docs/a11y-checklist.md`: full keyboard walkthrough (Tab/Shift-Tab/Enter/Space reach and operate every control) + a screen-reader walkthrough (VoiceOver) of both hero scenarios. Add customizable shortcuts + a high-contrast/large-text toggle for the low-vision north-star user.
- [ ] **Step 3:** Commit: `feat(a11y): axe gate + display controls`.

### Task 15: Two hero scenarios wired end-to-end

**Files:** Create `config/branding.ts`; seed data for demo.
- [ ] **Step 1:** Confirm the onboarding **request** ("new 5th-grade teacher, Monday — laptop, email, SIS access, classroom software") decomposes into multiple RITMs end-to-end.
- [ ] **Step 2:** Confirm an **incident** ("projector in room 12 won't turn on") classifies + routes with AI-extracted fields.
- [ ] **Step 3:** Commit: `feat: demo scenarios + branding config`.

---

## Phase 7 — Semantic deflection (THE CUT LINE)

> Build only if Phases 0–6 are green with time to spare. Everything above ships without this.

### Task 16: KB deflection at intake

**Files:** Create `config/kb-articles.ts`, extend `src/engine/intake.ts` (or a sibling `deflect.ts`), extend `IntakeBox`.
- [ ] **Step 1:** Add ~24 short demo KB articles (title + body) as DATA.
- [ ] **Step 2: failing test** — given intake text and the KB, `suggestArticles(text, kb)` returns the top relevant articles. Implement with a single Claude relevance call over the small in-context KB (no vector DB at this scale) — or a lightweight local similarity if latency matters.
- [ ] **Step 3:** Surface suggestions in `IntakeBox` BEFORE ticket creation ("these 2 articles may solve this — still file?"). If the user proceeds, create as normal (deflection is additive, never a gate).
- [ ] **Step 4:** Commit: `feat: semantic deflection`.

---

## Phase 8 — Deploy

### Task 17: Vercel
- [ ] **Step 1:** Set `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` in Vercel env (never in the repo).
- [ ] **Step 2:** Deploy; run the two hero scenarios + the axe spec against the deployed URL.
- [ ] **Step 3:** Write `docs/KNOWN-ISSUES.md` (phase-2 backlog) and a short README (what it is, the reskin playbook, how to swap `config/`). Commit: `chore: deploy + docs`.

**Definition of done (matches the spec):** both scenarios run end-to-end on Vercel; axe/Lighthouse clean; full keyboard + screen-reader walkthrough pass; phase-2 list documented.

---

## Error handling (woven into the tasks above, restated)

- **Malformed / low-confidence AI output** → `runIntake` throws `intake_unparseable`; the route returns a 422 and the UI falls back to a manual accessible form (Task 10 renders the catalog fields directly). Never persist a garbage record.
- **Missing required fields** → the clarification loop (Task 11), not an error.
- **Claude API down** → route catches, returns 503; UI shows the manual form. The app is never fully blocked by the model.
- **Deflection miss** (Phase 7) → just create the ticket.

## Open items resolved at execution time

- `zodOutputFormat` import path + `thinking`/`output_config` compatibility on the pinned SDK version (Task 5 note).
- React Aria current prop names (Tasks 10–13 notes).
- Supabase table shapes vs. the domain types (Task 9).
