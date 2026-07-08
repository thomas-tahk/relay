"use client";

import { Checkbox } from "react-aria-components";
import { getCatalogItem } from "@config/catalog";
import type { Request } from "@/domain/types";

/**
 * The consolidated view Relay exists to provide: one REQ, its RITMs, and every
 * SCTASK with a working checkbox — all on a single page, instead of ServiceNow's
 * three-record navigation. Toggling a task calls back to persist it.
 */
export function RequestTree({
  request,
  onToggle,
}: {
  request: Request;
  onToggle: (taskId: string) => void;
}) {
  const allTasks = request.items.flatMap((i) => i.tasks);
  const done = allTasks.filter((t) => t.done).length;

  return (
    <div>
      <p className="record-id">{request.id}</p>
      <h2 className="record-title">{request.summary}</h2>
      <p className="hint">
        {done} of {allTasks.length} tasks complete · {request.items.length} item(s)
      </p>

      <div style={{ marginTop: "1.2rem" }}>
        {request.items.map((item) => {
          const catalogItem = getCatalogItem(item.catalogItemId);
          return (
            <div className="ritm" key={item.id}>
              <p className="record-id">{item.id}</p>
              <p className="ritm-name">{catalogItem?.name ?? item.catalogItemId}</p>
              <dl className="field-grid">
                {Object.entries(item.values).map(([key, value]) => (
                  <div style={{ display: "contents" }} key={key}>
                    <dt className="field-key">{catalogItem?.fields.find((f) => f.key === key)?.label ?? key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>

              <ul className="tasklist">
                {item.tasks.map((task) => (
                  <li key={task.id}>
                    <Checkbox
                      className="task-check"
                      isSelected={task.done}
                      onChange={() => onToggle(task.id)}
                    >
                      <span className="cbox" aria-hidden="true">
                        ✓
                      </span>
                      <span className="task-label">{task.label}</span>
                      <span className="record-id task-id">{task.id.slice(0, 8)}</span>
                    </Checkbox>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
