import type { CatalogItem } from "@/domain/types";
import type { IntakeResult } from "@/domain/schema";

/** A required catalog field the intake result left unfilled. */
export interface MissingField {
  itemIndex: number;
  catalogItemId: string;
  key: string;
  label: string;
}

/**
 * Returns the required fields still missing from a request result — the input
 * to the clarification loop. Incidents have no catalog fields, so they never
 * produce missing entries.
 */
export function validateAgainstCatalog(
  result: IntakeResult,
  catalog: CatalogItem[],
): MissingField[] {
  if (result.kind !== "request") return [];

  const byId = new Map(catalog.map((c) => [c.id, c]));
  const missing: MissingField[] = [];

  result.items.forEach((item, itemIndex) => {
    const catalogItem = byId.get(item.catalogItemId);
    if (!catalogItem) return;
    for (const field of catalogItem.fields) {
      if (field.required && !item.values[field.key]?.trim()) {
        missing.push({
          itemIndex,
          catalogItemId: item.catalogItemId,
          key: field.key,
          label: field.label,
        });
      }
    }
  });

  return missing;
}
