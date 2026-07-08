import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { KbArticle } from "@/domain/types";

export const DEFLECT_MODEL = "claude-opus-4-8";

// What the model returns: the ids of articles that genuinely address the
// problem, each with a one-line reason. Empty is a valid, common answer —
// deflection is additive, never forced.
const DeflectionSchema = z.object({
  suggestions: z
    .array(z.object({ id: z.string(), reason: z.string() }))
    .max(3),
});

/** A KB article the requester might use to self-serve, with why it was surfaced. */
export interface Suggestion {
  article: KbArticle;
  reason: string;
}

/**
 * The slice of the Anthropic client suggestArticles depends on. Narrowed to one
 * method so tests inject a fake without a real client or an API key.
 */
export interface DeflectClient {
  messages: {
    parse(params: {
      model: string;
      max_tokens: number;
      system: string;
      output_config: { format: unknown };
      messages: { role: "user"; content: string }[];
    }): Promise<{ parsed_output: { suggestions: { id: string; reason: string }[] } | null }>;
  };
}

/**
 * Rank the knowledge base against a plain-language problem and return the
 * articles most likely to solve it — a single relevance call over the small
 * in-context KB (no vector store needed at this scale). Hallucinated ids are
 * dropped, so callers can trust every returned article is real. Any failure is
 * the caller's to treat as "no suggestions" — deflection must never block
 * filing a record.
 */
export async function suggestArticles(
  text: string,
  kb: KbArticle[],
  deps: { client?: DeflectClient } = {},
): Promise<Suggestion[]> {
  if (!text.trim() || kb.length === 0) return [];

  const client = deps.client ?? defaultClient();
  const res = await client.messages.parse({
    model: DEFLECT_MODEL,
    max_tokens: 1024,
    system: buildDeflectSystemPrompt(kb),
    output_config: { format: zodOutputFormat(DeflectionSchema) },
    messages: [{ role: "user", content: text }],
  });

  const suggestions = res.parsed_output?.suggestions ?? [];
  return suggestions
    .map(({ id, reason }) => {
      const article = kb.find((a) => a.id === id);
      return article ? { article, reason } : null;
    })
    .filter((s): s is Suggestion => s !== null);
}

export function buildDeflectSystemPrompt(kb: KbArticle[]): string {
  const articles = kb.map((a) => `- ${a.id} — ${a.title}: ${a.body}`).join("\n");

  return `You are the self-service assistant for Relay, an IT service desk.

The user is about to file a ticket. Your job is to spot when an existing help article would let them solve the problem themselves RIGHT NOW, before a ticket is created.

Rules:
- Return only articles that genuinely address THIS problem. Relevance must be high — a loose topical match is not enough.
- Return at most 3, most helpful first. Returning none is correct and expected when nothing truly fits, or when the user needs something provisioned (a new account, device, or access) rather than fixed.
- Use the EXACT article id shown. For each, give a one-line reason a person would find useful ("resets sync in ~5 minutes — no ticket needed").

Knowledge base:
${articles}`;
}

/** Real client, constructed lazily so tests never touch the API key. */
function defaultClient(): DeflectClient {
  const anthropic = new Anthropic();
  const parse = anthropic.messages.parse.bind(anthropic.messages) as (
    params: unknown,
  ) => Promise<{ parsed_output: unknown }>;
  return {
    messages: {
      async parse(params) {
        const res = await parse(params);
        return {
          parsed_output: (res.parsed_output ?? null) as {
            suggestions: { id: string; reason: string }[];
          } | null,
        };
      },
    },
  };
}
