import { catalog } from "@config/catalog";
import { demoSeed } from "@config/demo-seed";
import { MemoryRecordStore } from "@/data/memory-store";
import { assembleTree } from "@/engine/assemble";
import type { RecordStore } from "@/data/store";

// The memory store is a process singleton so records survive across requests
// in one `npm run dev` session. Stashed on globalThis so Next's hot-reload
// (which re-evaluates modules) doesn't wipe it mid-session.
declare global {
  // eslint-disable-next-line no-var
  var __relayStore: RecordStore | undefined;
}

/**
 * Returns the active RecordStore. Memory-backed for local dev, tests, and the
 * demo deploy — seeded with the hero scenarios so the workspace is never empty
 * (no database needed). A durable backend (e.g. Upstash) slots in here later.
 */
export function getStore(): RecordStore {
  if (!globalThis.__relayStore) {
    const store = new MemoryRecordStore();
    // saveTree on the memory store does its work synchronously, so the store is
    // fully populated before this returns — no await, no first-request race.
    for (const result of demoSeed) {
      store.saveTree(assembleTree(result, catalog));
    }
    globalThis.__relayStore = store;
  }
  return globalThis.__relayStore;
}
