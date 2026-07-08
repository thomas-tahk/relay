import { getStore } from "@/data/get-store";

/** GET a single record by id — a request (with its RITM/SCTASK tree) or an incident. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/records/[id]">,
): Promise<Response> {
  const { id } = await ctx.params;
  const store = getStore();

  const request = await store.getRequest(id);
  if (request) return Response.json({ kind: "request", request });

  const incident = await store.getIncident(id);
  if (incident) return Response.json({ kind: "incident", incident });

  return Response.json({ error: "not_found" }, { status: 404 });
}
