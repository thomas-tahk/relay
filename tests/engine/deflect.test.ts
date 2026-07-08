import { describe, it, expect, vi } from "vitest";
import { suggestArticles, DEFLECT_MODEL, type DeflectClient } from "@/engine/deflect";
import type { KbArticle } from "@/domain/types";

const kb: KbArticle[] = [
  { id: "kb-password-reset", title: "Reset your password", body: "Self-serve at the portal." },
  { id: "kb-projector-power", title: "Projector won't turn on", body: "Check power and input." },
];

function clientReturning(suggestions: { id: string; reason: string }[]) {
  const parse = vi.fn().mockResolvedValue({ parsed_output: { suggestions } });
  const client: DeflectClient = { messages: { parse } };
  return { client, parse };
}

describe("suggestArticles", () => {
  it("returns the matched articles with their reasons", async () => {
    const { client } = clientReturning([
      { id: "kb-password-reset", reason: "Resets sync in ~5 minutes — no ticket needed." },
    ]);

    const out = await suggestArticles("I forgot my password", kb, { client });

    expect(out).toEqual([
      {
        article: kb[0],
        reason: "Resets sync in ~5 minutes — no ticket needed.",
      },
    ]);
  });

  it("drops suggestions whose id is not a real article", async () => {
    const { client } = clientReturning([
      { id: "kb-does-not-exist", reason: "hallucinated" },
      { id: "kb-projector-power", reason: "Check the input source." },
    ]);

    const out = await suggestArticles("projector dead", kb, { client });

    expect(out.map((s) => s.article.id)).toEqual(["kb-projector-power"]);
  });

  it("sends the model and a KB-aware system prompt", async () => {
    const { client, parse } = clientReturning([]);

    await suggestArticles("my printer is offline", kb, { client });

    const params = parse.mock.calls[0][0];
    expect(params.model).toBe(DEFLECT_MODEL);
    expect(params.system).toContain("kb-projector-power");
    expect(params.messages).toEqual([{ role: "user", content: "my printer is offline" }]);
    expect(params.output_config.format).toBeDefined();
  });

  it("returns empty without calling the model when text is blank", async () => {
    const { client, parse } = clientReturning([]);

    expect(await suggestArticles("   ", kb, { client })).toEqual([]);
    expect(parse).not.toHaveBeenCalled();
  });

  it("returns empty when the model suggests nothing", async () => {
    const { client } = clientReturning([]);
    expect(await suggestArticles("provision a brand new laptop", kb, { client })).toEqual([]);
  });
});
