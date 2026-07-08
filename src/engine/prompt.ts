import type { CatalogItem } from "@/domain/types";

/**
 * Builds the intake system prompt. The catalog is injected as data so the
 * model always sees the exact item ids and field keys it must emit — keeping
 * the engine domain-agnostic (swap the catalog, not this function).
 */
export function buildIntakeSystemPrompt(catalog: CatalogItem[]): string {
  const catalogText = catalog.map(describeItem).join("\n");

  return `You are the intake classifier for Relay, an IT service desk tool.

Classify the user's message as either:
- an "incident" — something is broken or not working, or
- a "request" — the user needs something provisioned, granted, or set up.

For a REQUEST:
- Choose one or more catalog items below that fulfil the need.
- Use the EXACT catalogItemId and the EXACT field keys shown.
- Infer a field value ONLY when the message clearly states or strongly implies it. Never invent values; omit fields you cannot infer (the app will ask the user).
- Write a short summary of the overall request.

For an INCIDENT:
- Provide a short description, a category, an urgency of "low", "medium", or "high", and the affected item.

Catalog:
${catalogText}`;
}

function describeItem(item: CatalogItem): string {
  const fields = item.fields
    .map((f) => {
      const req = f.required ? "required" : "optional";
      const opts = f.type === "select" ? ` (one of: ${f.options?.join(", ")})` : "";
      return `    - ${f.key} — ${f.label} [${req}]${opts}`;
    })
    .join("\n");
  return `- ${item.id} — ${item.name}: ${item.description}\n${fields}`;
}
