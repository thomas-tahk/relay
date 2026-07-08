"use client";

import { useState } from "react";
import { Button, Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { getCatalogItem } from "@config/catalog";
import type { CatalogField } from "@/domain/types";
import type { IntakeResult } from "@/domain/schema";
import type { MissingField } from "@/engine/validate";
import { CatalogFieldInput } from "@/components/CatalogFieldInput";

interface Props {
  missing: MissingField[];
  result: IntakeResult;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (filled: IntakeResult) => void;
}

const slot = (m: MissingField) => `${m.itemIndex}:${m.key}`;

/** Asks only the required fields the model could not fill, then merges the
 * answers back into the intake result. Requests only — incidents have no fields. */
export function ClarifyDialog({ missing, result, isOpen, onOpenChange, onComplete }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const allFilled = missing.every((m) => values[slot(m)]?.trim());

  function fieldDef(m: MissingField): CatalogField | undefined {
    return getCatalogItem(m.catalogItemId)?.fields.find((f) => f.key === m.key);
  }

  function submit() {
    if (result.kind !== "request") return;
    const items = result.items.map((item, index) => {
      const patch: Record<string, string> = {};
      for (const m of missing) {
        if (m.itemIndex === index) patch[m.key] = values[slot(m)].trim();
      }
      return { ...item, values: { ...item.values, ...patch } };
    });
    onComplete({ ...result, items });
    onOpenChange(false);
  }

  return (
    <ModalOverlay className="modal-overlay" isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Modal className="modal">
        <Dialog className="modal-body" aria-label="Complete request details">
          <Heading slot="title" className="dialog-title">
            A few more details
          </Heading>
          <p className="dialog-sub">
            Relay needs these to complete the request. Everything else is already filled in.
          </p>

          {missing.map((m) => {
            const def = fieldDef(m);
            if (!def) return null;
            return (
              <CatalogFieldInput
                key={slot(m)}
                field={def}
                value={values[slot(m)] ?? ""}
                onChange={(v) => setValues((prev) => ({ ...prev, [slot(m)]: v }))}
              />
            );
          })}

          <div className="dialog-actions">
            <Button className="btn btn-ghost" onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="btn btn-primary" onPress={submit} isDisabled={!allFilled}>
              Save details
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
