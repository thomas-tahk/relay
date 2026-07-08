import { MemoryRecordStore } from "@/data/memory-store";
import type { RecordStore } from "@/data/store";

// The memory store is a process singleton so records survive across requests
// in one `npm run dev` session. Stashed on globalThis so Next's hot-reload
// (which re-evaluates modules) doesn't wipe it mid-session.
declare global {
  // eslint-disable-next-line no-var
  var __relayStore: RecordStore | undefined;
}

/**
 * Returns the active RecordStore. Memory-backed for local dev and tests; the
 * Supabase branch (required for the stateless serverless deploy) slots in here
 * once its env vars are present.
 */
export function getStore(): RecordStore {
  if (!globalThis.__relayStore) {
    globalThis.__relayStore = new MemoryRecordStore();
  }
  return globalThis.__relayStore;
}
