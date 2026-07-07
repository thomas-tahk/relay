import type { Incident, Request, RecordTree } from "@/domain/types";
import type { RecordStore } from "@/data/store";

/** In-memory RecordStore for tests and local dev (no external services). */
export class MemoryRecordStore implements RecordStore {
  private readonly requests = new Map<string, Request>();
  private readonly incidents = new Map<string, Incident>();

  async saveTree(tree: RecordTree): Promise<void> {
    if (tree.kind === "request") {
      this.requests.set(tree.request.id, tree.request);
    } else {
      this.incidents.set(tree.incident.id, tree.incident);
    }
  }

  async getRequest(id: string): Promise<Request | null> {
    return this.requests.get(id) ?? null;
  }

  async listRequests(): Promise<Request[]> {
    return [...this.requests.values()];
  }

  async toggleTask(taskId: string): Promise<void> {
    for (const request of this.requests.values()) {
      for (const item of request.items) {
        const task = item.tasks.find((t) => t.id === taskId);
        if (task) {
          task.done = !task.done;
          return;
        }
      }
    }
  }
}
