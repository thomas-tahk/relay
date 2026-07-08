# Relay

**Plain-language IT requests → structured records, on one page.**

Relay is a minified, accessible-by-default take on an ITSM request tool — the
good parts of ServiceNow without the three-page navigation tax. You describe
what you need in your own words; Claude classifies it (incident vs. request) and
structures it into records; a fulfiller works the whole thing — REQ → RITM →
SCTASK — on a **single consolidated page**.

Two things make it more than a form:

1. **Accessibility is the product, not a checkbox.** Keyboard- and
   screen-reader-first (built on [React Aria](https://react-spectrum.adobe.com/react-aria/)),
   with a high-contrast / large-text display mode for low-vision users. An
   automated [axe](https://github.com/dequelabs/axe-core) gate asserts zero
   violations on every `npm test`.
2. **It's reskinnable as data.** Point it at a new domain (school district, HR,
   facilities) by swapping two files in `config/` — no code changes.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

- **`/`** — the requester: describe a need, review Relay's structured record, file it.
- **`/workspace`** — the fulfiller: the consolidated REQ → RITM → SCTASK view,
  seeded with two hero scenarios so it's never empty.

### With or without an API key

Relay is fully clickable **without** an API key. The intake endpoint returns a
503 when no key is set, and the UI falls back to a manual catalog form that
produces the exact same record shape — so the structure → file → workspace loop
works either way.

To enable AI classification and KB deflection:

```bash
cp .env.example .env.local
# then paste your key after ANTHROPIC_API_KEY= (never commit this file)
npm run dev
```

The key is read server-side only (in the API routes) and never reaches the
client bundle.

## How it works

```
requester text
   → POST /api/deflect   → Claude ranks a small KB; suggests self-service articles (additive, never blocks)
   → POST /api/intake    → Claude classifies + structures into an IntakeResult (Zod-validated)
   → clarify missing required fields (React Aria dialog)
   → POST /api/records   → assembleTree() expands catalog items into RITMs + default SCTASKs; persisted
   → /workspace          → one page: REQ header, RITM cards, SCTASK checkboxes (toggle persists)
```

- **`src/domain`** — types + the Zod intake schema (the contract Claude fills).
- **`src/engine`** — pure, dependency-injected logic: `intake`, `deflect`,
  `assemble`, `validate`. Every engine test runs with **no API key** by
  injecting a fake client.
- **`src/data`** — the `RecordStore` interface + an in-memory implementation.
- **`src/app/api`** — thin Route Handlers over the engine.
- **`src/components`** — React Aria UI (intake, clarify dialog, request tree,
  deflection panel, display controls).

## Reskin playbook

Everything domain-specific lives in `config/` as data:

| File | What it controls |
| --- | --- |
| `config/catalog.ts` | The requestable items, their fields, and default SCTASKs. |
| `config/branding.ts` | Product name, tagline, and the org the instance is deployed for. |
| `config/kb-articles.ts` | The knowledge base used for intake deflection. |
| `config/demo-seed.ts` | The hero scenarios seeded into the workspace. |

Swap those four files and Relay retargets — the engine, UI, and accessibility
work are untouched. This is how the same codebase becomes a tailored demo per
application.

## Testing

```bash
npm test           # engine unit tests + the axe accessibility gate (40 tests)
```

Accessibility is verified twice: the automated axe gate above, and a manual
keyboard + screen-reader walkthrough in [`docs/a11y-checklist.md`](docs/a11y-checklist.md).

## Deploy

Relay deploys to Vercel with **no database** — the workspace is seeded with the
hero scenarios, so the demo is always populated. Set `ANTHROPIC_API_KEY` in the
Vercel project to enable AI classification.

The in-memory store means a *freshly-filed* record may not survive a serverless
cold start between requests. If durable persistence is wanted, the `RecordStore`
interface is the single seam to implement against a backend that does not sleep
on inactivity (e.g. Upstash Redis).

## Stack

Next.js 16 (App Router) · TypeScript · React Aria Components · Zod ·
`@anthropic-ai/sdk` (Claude) · Vitest + axe-core · Vercel.
