import { describe, it, expect } from "vitest";
import { assembleTree } from "@/engine/assemble";
import { catalog } from "@config/catalog";
import type { IntakeResult } from "@/domain/schema";

function counter() {
  let n = 0;
  return () => `ID${n++}`;
}
const fixedNow = () => "2026-07-07T00:00:00.000Z";

describe("assembleTree", () => {
  it("expands a request item into a RITM with its default SCTASKs", () => {
    const result: IntakeResult = {
      kind: "request",
      summary: "New laptop for J. Doe",
      items: [
        {
          catalogItemId: "new-laptop",
          values: { employeeName: "J. Doe", building: "HS", model: "Standard laptop" },
        },
      ],
    };

    const tree = assembleTree(result, catalog, { newId: counter(), now: fixedNow });
    if (tree.kind !== "request") throw new Error("expected request");

    expect(tree.request.id).toBe("ID0");
    expect(tree.request.createdAt).toBe("2026-07-07T00:00:00.000Z");
    const ritm = tree.request.items[0];
    expect(ritm.reqId).toBe("ID0");
    expect(ritm.values.employeeName).toBe("J. Doe");
    expect(ritm.tasks.map((t) => t.label)).toEqual([
      "Image laptop",
      "Assign asset tag",
      "Deliver to user",
    ]);
    expect(ritm.tasks.every((t) => t.done === false && t.ritmId === ritm.id)).toBe(true);
  });

  it("assembles an incident record", () => {
    const result: IntakeResult = {
      kind: "incident",
      shortDescription: "Projector dead",
      category: "Hardware",
      urgency: "high",
      affectedItem: "Room 12 projector",
    };

    const tree = assembleTree(result, catalog, { newId: counter(), now: fixedNow });
    if (tree.kind !== "incident") throw new Error("expected incident");
    expect(tree.incident.id).toBe("ID0");
    expect(tree.incident.urgency).toBe("high");
    expect(tree.incident.createdAt).toBe("2026-07-07T00:00:00.000Z");
  });

  it("throws when the model named an unknown catalog item", () => {
    const result: IntakeResult = {
      kind: "request",
      summary: "bad",
      items: [{ catalogItemId: "teleporter", values: {} }],
    };
    expect(() => assembleTree(result, catalog)).toThrow(/unknown_catalog_item/);
  });
});
