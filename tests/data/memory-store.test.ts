import { describe, it, expect } from "vitest";
import { MemoryRecordStore } from "@/data/memory-store";
import type { Request, RecordTree } from "@/domain/types";

function sampleRequest(id = "REQ001"): Request {
  return {
    id,
    summary: "Onboard new teacher",
    createdAt: "2026-07-07T00:00:00.000Z",
    items: [
      {
        id: "RITM001",
        reqId: id,
        catalogItemId: "new-laptop",
        values: { employeeName: "J. Doe" },
        tasks: [{ id: "SCTASK001", ritmId: "RITM001", label: "Image laptop", done: false }],
      },
    ],
  };
}

describe("MemoryRecordStore", () => {
  it("saves and retrieves a request tree", async () => {
    const store = new MemoryRecordStore();
    await store.saveTree({ kind: "request", request: sampleRequest() });

    const got = await store.getRequest("REQ001");
    expect(got?.summary).toBe("Onboard new teacher");
    expect(await store.listRequests()).toHaveLength(1);
  });

  it("returns null for an unknown request", async () => {
    const store = new MemoryRecordStore();
    expect(await store.getRequest("nope")).toBeNull();
  });

  it("toggles a task's done flag", async () => {
    const store = new MemoryRecordStore();
    await store.saveTree({ kind: "request", request: sampleRequest() });

    await store.toggleTask("SCTASK001");
    expect((await store.getRequest("REQ001"))?.items[0].tasks[0].done).toBe(true);

    await store.toggleTask("SCTASK001");
    expect((await store.getRequest("REQ001"))?.items[0].tasks[0].done).toBe(false);
  });

  it("no-ops when toggling an unknown task", async () => {
    const store = new MemoryRecordStore();
    await store.saveTree({ kind: "request", request: sampleRequest() });
    await expect(store.toggleTask("missing")).resolves.toBeUndefined();
  });

  it("keeps incidents separate from requests but retrievable", async () => {
    const store = new MemoryRecordStore();
    const tree: RecordTree = {
      kind: "incident",
      incident: {
        id: "INC001",
        shortDescription: "Projector dead",
        category: "Hardware",
        urgency: "high",
        affectedItem: "Room 12 projector",
        createdAt: "2026-07-07T00:00:00.000Z",
      },
    };
    await store.saveTree(tree);

    expect(await store.listRequests()).toHaveLength(0);
    expect(await store.listIncidents()).toHaveLength(1);
    expect((await store.getIncident("INC001"))?.shortDescription).toBe("Projector dead");
    expect(await store.getIncident("nope")).toBeNull();
  });
});
