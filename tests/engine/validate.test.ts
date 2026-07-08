import { describe, it, expect } from "vitest";
import { validateAgainstCatalog } from "@/engine/validate";
import { catalog } from "@config/catalog";
import type { IntakeResult } from "@/domain/schema";

describe("validateAgainstCatalog", () => {
  it("reports required fields the model could not fill", () => {
    const result: IntakeResult = {
      kind: "request",
      summary: "New laptop",
      items: [{ catalogItemId: "new-laptop", values: { employeeName: "J. Doe" } }],
    };

    const missing = validateAgainstCatalog(result, catalog);
    expect(missing.map((m) => m.key).sort()).toEqual(["building", "model"]);
    expect(missing.every((m) => m.itemIndex === 0)).toBe(true);
  });

  it("returns nothing when all required fields are present", () => {
    const result: IntakeResult = {
      kind: "request",
      summary: "New laptop",
      items: [
        {
          catalogItemId: "new-laptop",
          values: { employeeName: "J. Doe", building: "HS", model: "Standard laptop" },
        },
      ],
    };
    expect(validateAgainstCatalog(result, catalog)).toEqual([]);
  });

  it("treats blank values as missing", () => {
    const result: IntakeResult = {
      kind: "request",
      summary: "New laptop",
      items: [
        {
          catalogItemId: "new-laptop",
          values: { employeeName: "  ", building: "HS", model: "Standard laptop" },
        },
      ],
    };
    expect(validateAgainstCatalog(result, catalog).map((m) => m.key)).toEqual(["employeeName"]);
  });

  it("never reports missing fields for incidents", () => {
    const result: IntakeResult = {
      kind: "incident",
      shortDescription: "x",
      category: "Hardware",
      urgency: "low",
      affectedItem: "y",
    };
    expect(validateAgainstCatalog(result, catalog)).toEqual([]);
  });
});
