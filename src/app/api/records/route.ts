import { catalog } from "@config/catalog";
import { assembleTree } from "@/engine/assemble";
import { getStore } from "@/data/get-store";
import { IntakeResultSchema } from "@/domain/schema";

/** POST an (edited) intake result → assemble the record tree and persist it. */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = IntakeResultSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_result", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  let tree;
  try {
    tree = assembleTree(parsed.data, catalog);
  } catch (err) {
    const message = err instanceof Error ? err.message : "assemble_failed";
    return Response.json({ error: message }, { status: 400 });
  }

  await getStore().saveTree(tree);
  const id = tree.kind === "request" ? tree.request.id : tree.incident.id;
  return Response.json({ id, kind: tree.kind }, { status: 201 });
}

/** GET the fulfiller queue: every request and incident on record. */
export async function GET(): Promise<Response> {
  const store = getStore();
  const [requests, incidents] = await Promise.all([
    store.listRequests(),
    store.listIncidents(),
  ]);
  return Response.json({ requests, incidents });
}
