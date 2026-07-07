// Core domain types for Relay.
//
// Request hierarchy mirrors ServiceNow's REQ -> RITM -> SCTASK, which is the
// fragmentation the consolidated workspace is built to flatten:
//   Request (REQ) -> RequestItem (RITM) -> CatalogTask (SCTASK)
// Incident is standalone: classified and routed, never "managed" in this slice.

export type Urgency = "low" | "medium" | "high";

/** A fulfillment task under a RequestItem (SCTASK). */
export interface CatalogTask {
  id: string;
  ritmId: string;
  label: string;
  done: boolean;
}

/** A single requested item under a Request (RITM). */
export interface RequestItem {
  id: string;
  reqId: string;
  catalogItemId: string;
  /** Field values keyed by CatalogField.key. */
  values: Record<string, string>;
  tasks: CatalogTask[];
}

/** A top-level request (REQ). */
export interface Request {
  id: string;
  summary: string;
  createdAt: string;
  items: RequestItem[];
}

/** A standalone incident. */
export interface Incident {
  id: string;
  shortDescription: string;
  category: string;
  urgency: Urgency;
  affectedItem: string;
  createdAt: string;
}

/** The two record shapes intake can produce. */
export type RecordTree =
  | { kind: "request"; request: Request }
  | { kind: "incident"; incident: Incident };

// --- Catalog (the reskin surface — lives as DATA in config/) ---

export type FieldType = "text" | "select";

export interface CatalogField {
  key: string;
  label: string;
  required: boolean;
  type: FieldType;
  /** Allowed values when type === "select". */
  options?: string[];
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  fields: CatalogField[];
  /** Labels for the SCTASKs auto-created when this item is requested. */
  defaultTasks: string[];
}
