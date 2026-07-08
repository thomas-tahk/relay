import type { Incident, Request, RecordTree } from "@/domain/types";

// Persistence boundary. The engine and API depend on this interface only;
// the in-memory impl backs tests and local dev, Supabase backs the demo.
export interface RecordStore {
  saveTree(tree: RecordTree): Promise<void>;
  getRequest(id: string): Promise<Request | null>;
  listRequests(): Promise<Request[]>;
  getIncident(id: string): Promise<Incident | null>;
  listIncidents(): Promise<Incident[]>;
  /** Flip the done flag on a single SCTASK. No-op if the task is unknown. */
  toggleTask(taskId: string): Promise<void>;
}
