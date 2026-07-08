import { getStore } from "@/data/get-store";

/** PATCH toggles a single SCTASK's done flag. No body needed. */
export async function PATCH(
  _request: Request,
  ctx: RouteContext<"/api/tasks/[id]">,
): Promise<Response> {
  const { id } = await ctx.params;
  await getStore().toggleTask(id);
  return Response.json({ ok: true });
}
