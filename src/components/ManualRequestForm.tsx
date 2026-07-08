"use client";

import { useState } from "react";
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from "react-aria-components";
import { catalog, getCatalogItem } from "@config/catalog";
import type { IntakeResult } from "@/domain/schema";
import { CatalogFieldInput } from "@/components/CatalogFieldInput";

/**
 * The catalog-driven path used when the AI classifier is unavailable (no API
 * key) or when a requester would rather pick directly. Produces the same intake
 * result shape the AI path does, so everything downstream is identical.
 */
export function ManualRequestForm({ onSubmit }: { onSubmit: (result: IntakeResult) => void }) {
  const [itemId, setItemId] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({});
  const item = itemId ? getCatalogItem(itemId) : undefined;

  const requiredFilled =
    item?.fields.filter((f) => f.required).every((f) => values[f.key]?.trim()) ?? false;

  function pick(id: string) {
    setItemId(id);
    setValues({});
  }

  function submit() {
    if (!item) return;
    onSubmit({
      kind: "request",
      summary: item.name,
      items: [{ catalogItemId: item.id, values }],
    });
  }

  return (
    <div className="card">
      <div className="card-band band-request" />
      <div className="card-body">
        <Select
          className="field"
          selectedKey={itemId || null}
          onSelectionChange={(key) => pick(String(key))}
        >
          <Label>
            <span className="field-label">What do you need?</span>
          </Label>
          <Button className="select-btn">
            <SelectValue>
              {({ isPlaceholder }) => (isPlaceholder ? "Choose a request…" : item?.name)}
            </SelectValue>
            <span aria-hidden="true">▾</span>
          </Button>
          <Popover className="listbox">
            <ListBox>
              {catalog.map((c) => (
                <ListBoxItem key={c.id} id={c.id} className="listbox-item" textValue={c.name}>
                  {c.name}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>

        {item && (
          <>
            <p className="dialog-sub">{item.description}</p>
            {item.fields.map((field) => (
              <CatalogFieldInput
                key={field.key}
                field={field}
                value={values[field.key] ?? ""}
                onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
              />
            ))}
            <div className="dialog-actions">
              <Button className="btn btn-primary" onPress={submit} isDisabled={!requiredFilled}>
                Create request
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
