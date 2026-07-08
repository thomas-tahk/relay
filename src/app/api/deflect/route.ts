import { kbArticles } from "@config/kb-articles";
import { suggestArticles } from "@/engine/deflect";

// Server-only: suggestArticles constructs the Anthropic client, which reads
// ANTHROPIC_API_KEY. Deflection is additive — any failure (including no key)
// returns an empty list so the UI proceeds straight to filing, never blocked.
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const text = (body as { text?: unknown })?.text;
  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ suggestions: [] });
  }

  try {
    const suggestions = await suggestArticles(text, kbArticles);
    return Response.json({ suggestions });
  } catch {
    // Deflection never gates a request; on any error, surface nothing.
    return Response.json({ suggestions: [] });
  }
}
