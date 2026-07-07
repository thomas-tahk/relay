import { describe, it, expect, vi } from "vitest";
import { runIntake, INTAKE_MODEL, type IntakeClient } from "@/engine/intake";
import type { IntakeResult } from "@/domain/schema";

function clientReturning(output: IntakeResult | null) {
  const parse = vi.fn().mockResolvedValue({ parsed_output: output });
  const client: IntakeClient = { messages: { parse } };
  return { client, parse };
}

describe("runIntake", () => {
  it("returns the parsed structured result", async () => {
    const result: IntakeResult = {
      kind: "request",
      summary: "Onboard new teacher",
      items: [{ catalogItemId: "new-laptop", values: { employeeName: "J. Doe" } }],
    };
    const { client } = clientReturning(result);

    expect(await runIntake("New teacher needs a laptop", { client })).toEqual(result);
  });

  it("sends the model, a catalog-aware system prompt, and the raw input", async () => {
    const { client, parse } = clientReturning({
      kind: "incident",
      shortDescription: "Projector dead",
      category: "Hardware",
      urgency: "high",
      affectedItem: "Room 12 projector",
    });

    await runIntake("The projector in Room 12 won't turn on", { client });

    const params = parse.mock.calls[0][0];
    expect(params.model).toBe(INTAKE_MODEL);
    expect(params.system).toContain("new-laptop");
    expect(params.messages).toEqual([
      { role: "user", content: "The projector in Room 12 won't turn on" },
    ]);
    expect(params.output_config.format).toBeDefined();
  });

  it("throws intake_unparseable when the model output cannot be parsed", async () => {
    const { client } = clientReturning(null);
    await expect(runIntake("???", { client })).rejects.toThrow("intake_unparseable");
  });
});
