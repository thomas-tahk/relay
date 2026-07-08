"use client";

import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  TextField,
  Input,
} from "react-aria-components";
import type { CatalogField } from "@/domain/types";

interface Props {
  field: CatalogField;
  value: string;
  onChange: (value: string) => void;
}

/** Renders the correct React Aria control for a catalog field (text or select). */
export function CatalogFieldInput({ field, value, onChange }: Props) {
  const label = (
    <span className="field-label">
      {field.label}
      {field.required && <span className="req" aria-hidden="true">*</span>}
    </span>
  );

  if (field.type === "select") {
    return (
      <Select
        className="field"
        selectedKey={value || null}
        onSelectionChange={(key) => onChange(String(key))}
        aria-label={field.label}
      >
        <Label>{label}</Label>
        <Button className="select-btn">
          <SelectValue>{({ isPlaceholder }) => (isPlaceholder ? "Select…" : value)}</SelectValue>
          <span aria-hidden="true">▾</span>
        </Button>
        <Popover className="listbox">
          <ListBox>
            {(field.options ?? []).map((option) => (
              <ListBoxItem key={option} id={option} className="listbox-item">
                {option}
              </ListBoxItem>
            ))}
          </ListBox>
        </Popover>
      </Select>
    );
  }

  return (
    <TextField
      className="field"
      value={value}
      onChange={onChange}
      aria-label={field.label}
    >
      <Label>{label}</Label>
      <Input className="field-control" />
    </TextField>
  );
}
