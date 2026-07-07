import { describe, it, expect } from "vitest";
import { buildIntakeSystemPrompt } from "@/engine/prompt";
import { catalog } from "@config/catalog";

describe("buildIntakeSystemPrompt", () => {
  it("instructs the model to distinguish incident vs request", () => {
    const prompt = buildIntakeSystemPrompt(catalog);
    expect(prompt).toMatch(/incident/i);
    expect(prompt).toMatch(/request/i);
  });

  it("lists every catalog id and each required field key", () => {
    const prompt = buildIntakeSystemPrompt(catalog);
    for (const item of catalog) {
      expect(prompt).toContain(item.id);
      for (const field of item.fields.filter((f) => f.required)) {
        expect(prompt).toContain(field.key);
      }
    }
  });
});
