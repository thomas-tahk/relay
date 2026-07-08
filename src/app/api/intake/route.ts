import { catalog } from "@config/catalog";
import { runIntake } from "@/engine/intake";
import { validateAgainstCatalog } from "@/engine/validate";

// Server-only: runIntake constructs the Anthropic client, which reads
// ANTHROPIC_API_KEY. The key never reaches the client bundle.
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const text = (body as { text?: unknown })?.text;
  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "empty_intake" }, { status: 400 });
  }

  try {
    const result = await runIntake(text);
    const missing = validateAgainstCatalog(result, catalog);
    return Response.json({ result, missing });
  } catch (err) {
    if (isMissingKey(err)) {
      return Response.json({ error: "missing_api_key" }, { status: 503 });
    }
    return Response.json({ error: "intake_failed" }, { status: 502 });
  }
}

// The Anthropic SDK throws an authentication error when no key is configured;
// surface that distinctly so the UI can tell the operator to set .env.local.
function isMissingKey(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /api[_ ]?key|authentication|ANTHROPIC_API_KEY/i.test(msg);
}
