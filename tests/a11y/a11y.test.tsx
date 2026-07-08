// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import axe from "axe-core";
import RequesterPage from "@/app/page";
import { RecordPreview } from "@/components/RecordPreview";
import { RequestTree } from "@/components/RequestTree";
import { DeflectionPanel } from "@/components/DeflectionPanel";
import { ManualRequestForm } from "@/components/ManualRequestForm";
import { DisplayControls } from "@/components/DisplayControls";
import type { IntakeResult } from "@/domain/schema";
import type { Request } from "@/domain/types";

// jsdom has no layout engine, so axe's color-contrast rule can't run here — it
// is covered by the manual checklist and the high-contrast display toggle. Every
// other rule (labels, roles, names, landmarks, heading order) runs in full.
async function violationsIn(container: HTMLElement): Promise<string[]> {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map((v) => `${v.id}: ${v.help}`);
}

const sampleRequest: Request = {
  id: "REQ-sample",
  summary: "Onboard a new teacher",
  createdAt: "2026-07-08T00:00:00.000Z",
  items: [
    {
      id: "RITM-sample",
      reqId: "REQ-sample",
      catalogItemId: "new-laptop",
      values: { employeeName: "Priya Shah", building: "Lincoln Elementary", model: "Standard laptop" },
      tasks: [
        { id: "SCTASK-1", ritmId: "RITM-sample", label: "Image laptop", done: false },
        { id: "SCTASK-2", ritmId: "RITM-sample", label: "Deliver to user", done: true },
      ],
    },
  ],
};

const sampleIncident: IntakeResult = {
  kind: "incident",
  shortDescription: "Projector in Room 12 won't turn on",
  category: "Classroom AV",
  urgency: "high",
  affectedItem: "Room 12 projector",
};

const sampleRequestResult: IntakeResult = {
  kind: "request",
  summary: "New laptop for Priya Shah",
  items: [{ catalogItemId: "new-laptop", values: { employeeName: "Priya Shah" } }],
};

describe("accessibility (axe)", () => {
  it("requester page has no violations", async () => {
    const { container } = render(<RequesterPage />);
    expect(await violationsIn(container)).toEqual([]);
  });

  it("record preview (request) has no violations", async () => {
    const { container } = render(<RecordPreview result={sampleRequestResult} />);
    expect(await violationsIn(container)).toEqual([]);
  });

  it("record preview (incident) has no violations", async () => {
    const { container } = render(<RecordPreview result={sampleIncident} />);
    expect(await violationsIn(container)).toEqual([]);
  });

  it("consolidated request tree has no violations", async () => {
    const { container } = render(<RequestTree request={sampleRequest} onToggle={() => {}} />);
    expect(await violationsIn(container)).toEqual([]);
  });

  it("deflection panel has no violations", async () => {
    const { container } = render(
      <DeflectionPanel
        suggestions={[
          {
            article: { id: "kb-password-reset", title: "Reset your password", body: "Self-serve at the portal." },
            reason: "No ticket needed.",
          },
        ]}
        onContinue={() => {}}
        onReset={() => {}}
      />,
    );
    expect(await violationsIn(container)).toEqual([]);
  });

  it("manual request form has no violations", async () => {
    const { container } = render(<ManualRequestForm onSubmit={() => {}} />);
    expect(await violationsIn(container)).toEqual([]);
  });

  it("display controls have no violations", async () => {
    const { container } = render(<DisplayControls />);
    expect(await violationsIn(container)).toEqual([]);
  });
});
