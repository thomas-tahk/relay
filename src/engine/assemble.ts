import type {
  CatalogItem,
  CatalogTask,
  RecordTree,
  RequestItem,
} from "@/domain/types";
import type { IntakeResult } from "@/domain/schema";

export interface AssembleDeps {
  /** Id generator — inject a deterministic one in tests. */
  newId?: () => string;
  /** Clock — inject a fixed value in tests. */
  now?: () => string;
}

/**
 * Turns a validated intake result into a persistable RecordTree: generates
 * ids and timestamps, and expands each requested catalog item into a RITM
 * with its default SCTASKs. Throws if the model named an unknown catalog item.
 */
export function assembleTree(
  result: IntakeResult,
  catalog: CatalogItem[],
  deps: AssembleDeps = {},
): RecordTree {
  const newId = deps.newId ?? (() => crypto.randomUUID());
  const now = deps.now ?? (() => new Date().toISOString());

  if (result.kind === "incident") {
    return {
      kind: "incident",
      incident: {
        id: newId(),
        shortDescription: result.shortDescription,
        category: result.category,
        urgency: result.urgency,
        affectedItem: result.affectedItem,
        createdAt: now(),
      },
    };
  }

  const reqId = newId();
  const byId = new Map(catalog.map((c) => [c.id, c]));

  const items: RequestItem[] = result.items.map((proposed) => {
    const catalogItem = byId.get(proposed.catalogItemId);
    if (!catalogItem) {
      throw new Error(`unknown_catalog_item: ${proposed.catalogItemId}`);
    }
    const ritmId = newId();
    const tasks: CatalogTask[] = catalogItem.defaultTasks.map((label) => ({
      id: newId(),
      ritmId,
      label,
      done: false,
    }));
    return {
      id: ritmId,
      reqId,
      catalogItemId: proposed.catalogItemId,
      values: proposed.values,
      tasks,
    };
  });

  return {
    kind: "request",
    request: { id: reqId, summary: result.summary, createdAt: now(), items },
  };
}
