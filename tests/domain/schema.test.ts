import { describe, it, expect } from "vitest";
import { IntakeResultSchema } from "@/domain/schema";

describe("IntakeResultSchema", () => {
  it("parses a valid request result", () => {
    const parsed = IntakeResultSchema.parse({
      kind: "request",
      summary: "New hire onboarding for J. Doe",
      items: [{ catalogItemId: "new-laptop", values: { employeeName: "J. Doe" } }],
    });
    expect(parsed.kind).toBe("request");
  });

  it("parses a valid incident result", () => {
    const parsed = IntakeResultSchema.parse({
      kind: "incident",
      shortDescription: "Projector in Room 12 won't power on",
      category: "Hardware",
      urgency: "high",
      affectedItem: "Room 12 projector",
    });
    expect(parsed.kind).toBe("incident");
  });

  it("rejects a request with no items", () => {
    const result = IntakeResultSchema.safeParse({
      kind: "request",
      summary: "empty",
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid urgency", () => {
    const result = IntakeResultSchema.safeParse({
      kind: "incident",
      shortDescription: "x",
      category: "Hardware",
      urgency: "urgent",
      affectedItem: "y",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown kind", () => {
    const result = IntakeResultSchema.safeParse({ kind: "question", summary: "?" });
    expect(result.success).toBe(false);
  });
});
