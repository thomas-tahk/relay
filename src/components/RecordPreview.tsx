import { getCatalogItem } from "@config/catalog";
import type { IntakeResult } from "@/domain/schema";

/**
 * Shows what Relay understood before anything is filed: the classification and
 * the records it will create. Missing required fields are flagged inline so the
 * requester sees exactly what the clarify step will ask for.
 */
export function RecordPreview({ result }: { result: IntakeResult }) {
  if (result.kind === "incident") {
    return (
      <div className="card">
        <div className="card-band band-incident" />
        <div className="card-body">
          <p className="record-id">INCIDENT · will be logged on submit</p>
          <h3 className="record-title">{result.shortDescription}</h3>
          <dl className="meta-grid">
            <dt className="field-key">Category</dt>
            <dd>{result.category}</dd>
            <dt className="field-key">Urgency</dt>
            <dd className={result.urgency === "high" ? "urgency-high" : undefined}>
              {result.urgency}
            </dd>
            <dt className="field-key">Affected</dt>
            <dd>{result.affectedItem}</dd>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-band band-request" />
      <div className="card-body">
        <p className="record-id">REQUEST · {result.items.length} item(s) will be created</p>
        <h3 className="record-title">{result.summary}</h3>
        {result.items.map((item, i) => {
          const catalogItem = getCatalogItem(item.catalogItemId);
          return (
            <div className="ritm" key={i}>
              <p className="ritm-name">{catalogItem?.name ?? item.catalogItemId}</p>
              <dl className="field-grid">
                {(catalogItem?.fields ?? []).map((field) => {
                  const value = item.values[field.key]?.trim();
                  return (
                    <FieldRow
                      key={field.key}
                      label={field.label}
                      value={value}
                      required={field.required}
                    />
                  );
                })}
              </dl>
              {catalogItem && catalogItem.defaultTasks.length > 0 && (
                <ul className="tasklist">
                  {catalogItem.defaultTasks.map((task) => (
                    <li className="task" key={task}>
                      <span className="box" aria-hidden="true" />
                      {task}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  required,
}: {
  label: string;
  value: string | undefined;
  required: boolean;
}) {
  return (
    <>
      <dt className="field-key">{label}</dt>
      <dd className={value ? undefined : "field-missing"}>
        {value ?? (required ? "needs your input" : "—")}
      </dd>
    </>
  );
}
