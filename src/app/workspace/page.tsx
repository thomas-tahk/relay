"use client";

import { useEffect, useState } from "react";
import { ListBox, ListBoxItem } from "react-aria-components";
import Link from "next/link";
import type { Incident, Request } from "@/domain/types";
import { RequestTree } from "@/components/RequestTree";

export default function WorkspacePage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/records")
      .then((r) => r.json())
      .then((data: { requests: Request[]; incidents: Incident[] }) => {
        setRequests(data.requests);
        setIncidents(data.incidents);
        setSelectedId(data.requests[0]?.id ?? data.incidents[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleTask(taskId: string) {
    // Optimistic: flip locally, then persist.
    setRequests((prev) =>
      prev.map((req) => ({
        ...req,
        items: req.items.map((item) => ({
          ...item,
          tasks: item.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
        })),
      })),
    );
    fetch(`/api/tasks/${taskId}`, { method: "PATCH" }).catch(() => {});
  }

  const selectedRequest = requests.find((r) => r.id === selectedId);
  const selectedIncident = incidents.find((i) => i.id === selectedId);
  const hasRecords = requests.length > 0 || incidents.length > 0;

  return (
    <>
      <header className="app-header">
        <Link className="wordmark" href="/" style={{ textDecoration: "none" }}>
          <span className="dot" aria-hidden="true" />
          Relay
        </Link>
        <Link className="header-link" href="/">
          ← New request
        </Link>
      </header>

      <main className="workspace">
        <aside className="queue" aria-label="Request queue">
          <p className="eyebrow" style={{ padding: "0 0.5rem 0.5rem" }}>
            Queue · {requests.length + incidents.length}
          </p>
          {hasRecords ? (
            <ListBox
              aria-label="Records"
              selectionMode="single"
              selectedKeys={selectedId ? [selectedId] : []}
              onSelectionChange={(keys) => {
                const first = [...keys][0];
                if (first) setSelectedId(String(first));
              }}
            >
              {requests.map((req) => {
                const tasks = req.items.flatMap((i) => i.tasks);
                const done = tasks.filter((t) => t.done).length;
                return (
                  <ListBoxItem key={req.id} id={req.id} className="queue-item" textValue={req.summary}>
                    <span className="chip chip-request">Request</span>
                    <span className="queue-title">{req.summary}</span>
                    <span className="record-id">
                      {done}/{tasks.length} tasks · {req.id.slice(0, 8)}
                    </span>
                  </ListBoxItem>
                );
              })}
              {incidents.map((inc) => (
                <ListBoxItem
                  key={inc.id}
                  id={inc.id}
                  className="queue-item"
                  textValue={inc.shortDescription}
                >
                  <span className="chip chip-incident">Incident</span>
                  <span className="queue-title">{inc.shortDescription}</span>
                  <span className="record-id">
                    {inc.urgency} urgency · {inc.id.slice(0, 8)}
                  </span>
                </ListBoxItem>
              ))}
            </ListBox>
          ) : (
            <p className="hint" style={{ padding: "0.5rem" }}>
              {loading ? "Loading…" : "No records yet."}
            </p>
          )}
        </aside>

        <section className="detail" aria-label="Record detail">
          {selectedRequest && (
            <div className="card">
              <div className="card-band band-request" />
              <div className="card-body">
                <RequestTree request={selectedRequest} onToggle={toggleTask} />
              </div>
            </div>
          )}
          {selectedIncident && (
            <div className="card">
              <div className="card-band band-incident" />
              <div className="card-body">
                <p className="record-id">{selectedIncident.id}</p>
                <h2 className="record-title">{selectedIncident.shortDescription}</h2>
                <dl className="meta-grid" style={{ marginTop: "0.75rem" }}>
                  <dt className="field-key">Category</dt>
                  <dd>{selectedIncident.category}</dd>
                  <dt className="field-key">Urgency</dt>
                  <dd className={selectedIncident.urgency === "high" ? "urgency-high" : undefined}>
                    {selectedIncident.urgency}
                  </dd>
                  <dt className="field-key">Affected</dt>
                  <dd>{selectedIncident.affectedItem}</dd>
                </dl>
              </div>
            </div>
          )}
          {!selectedRequest && !selectedIncident && !loading && (
            <div className="empty-detail">
              <p className="hero-sub">
                Nothing filed yet. <Link href="/">Make a request</Link> to see it land here.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
