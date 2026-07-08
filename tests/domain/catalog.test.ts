import { describe, it, expect } from "vitest";
import { catalog, getCatalogItem } from "@config/catalog";

describe("district catalog", () => {
  it("has unique item ids", () => {
    const ids = catalog.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every item has at least one required field", () => {
    for (const item of catalog) {
      expect(item.fields.some((f) => f.required)).toBe(true);
    }
  });

  it("every select field defines non-empty options", () => {
    for (const item of catalog) {
      for (const field of item.fields) {
        if (field.type === "select") {
          expect(field.options && field.options.length > 0).toBe(true);
        }
      }
    }
  });

  it("every item defines at least one default task", () => {
    for (const item of catalog) {
      expect(item.defaultTasks.length).toBeGreaterThan(0);
    }
  });

  it("getCatalogItem resolves known ids and returns undefined otherwise", () => {
    expect(getCatalogItem("new-laptop")?.name).toBe("New Laptop");
    expect(getCatalogItem("does-not-exist")).toBeUndefined();
  });
});
