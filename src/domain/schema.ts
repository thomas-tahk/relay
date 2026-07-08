import { z } from "zod";

// The structured shape Claude must return from intake. This is the raw,
// pre-assembly proposal: catalog IDs + inferred field values, or an incident.
// IDs, timestamps, and default SCTASKs are added later by assembleTree().

export const UrgencySchema = z.enum(["low", "medium", "high"]);

const ProposedItemSchema = z.object({
  catalogItemId: z.string(),
  values: z.record(z.string(), z.string()),
});

const RequestResultSchema = z.object({
  kind: z.literal("request"),
  summary: z.string(),
  items: z.array(ProposedItemSchema).min(1),
});

const IncidentResultSchema = z.object({
  kind: z.literal("incident"),
  shortDescription: z.string(),
  category: z.string(),
  urgency: UrgencySchema,
  affectedItem: z.string(),
});

export const IntakeResultSchema = z.discriminatedUnion("kind", [
  RequestResultSchema,
  IncidentResultSchema,
]);

export type IntakeResult = z.infer<typeof IntakeResultSchema>;
export type ProposedItem = z.infer<typeof ProposedItemSchema>;
