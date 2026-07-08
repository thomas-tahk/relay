import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { catalog } from "@config/catalog";
import { IntakeResultSchema, type IntakeResult } from "@/domain/schema";
import { buildIntakeSystemPrompt } from "@/engine/prompt";

export const INTAKE_MODEL = "claude-opus-4-8";

/**
 * The slice of the Anthropic client runIntake depends on. Narrowed to one
 * method so tests can inject a fake without constructing a real client (and
 * without needing an API key).
 */
export interface IntakeClient {
  messages: {
    parse(params: {
      model: string;
      max_tokens: number;
      system: string;
      output_config: { format: unknown };
      messages: { role: "user"; content: string }[];
    }): Promise<{ parsed_output: IntakeResult | null }>;
  };
}

/** Classify + structure a plain-language message into a typed intake result. */
export async function runIntake(
  input: string,
  deps: { client?: IntakeClient } = {},
): Promise<IntakeResult> {
  const client = deps.client ?? defaultClient();
  const res = await client.messages.parse({
    model: INTAKE_MODEL,
    max_tokens: 4096,
    system: buildIntakeSystemPrompt(catalog),
    output_config: { format: zodOutputFormat(IntakeResultSchema) },
    messages: [{ role: "user", content: input }],
  });
  if (!res.parsed_output) throw new Error("intake_unparseable");
  return res.parsed_output;
}

/** Real client, constructed lazily so tests never touch the API key. */
function defaultClient(): IntakeClient {
  const anthropic = new Anthropic();
  const parse = anthropic.messages.parse.bind(anthropic.messages) as (
    params: unknown,
  ) => Promise<{ parsed_output: unknown }>;
  return {
    messages: {
      async parse(params) {
        const res = await parse(params);
        return { parsed_output: (res.parsed_output ?? null) as IntakeResult | null };
      },
    },
  };
}
