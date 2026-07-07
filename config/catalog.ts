import type { CatalogItem } from "@/domain/types";

// The requestable-item catalog for the school-district skin.
//
// THIS FILE IS THE RESKIN SEAM. To retarget Relay at another domain (HR-tech,
// facilities, procurement), swap this catalog and the branding config — the
// engine (intake, workspace, a11y) never changes.

export const catalog: CatalogItem[] = [
  {
    id: "new-laptop",
    name: "New Laptop",
    description: "Request a district-imaged laptop for a staff member.",
    fields: [
      { key: "employeeName", label: "Employee name", required: true, type: "text" },
      { key: "building", label: "Building / site", required: true, type: "text" },
      {
        key: "model",
        label: "Model",
        required: true,
        type: "select",
        options: ["Standard laptop", "Touchscreen laptop", "Rugged laptop"],
      },
      { key: "justification", label: "Justification", required: false, type: "text" },
    ],
    defaultTasks: ["Image laptop", "Assign asset tag", "Deliver to user"],
  },
  {
    id: "email-account",
    name: "Email Account",
    description: "Provision a district email mailbox.",
    fields: [
      { key: "employeeName", label: "Employee name", required: true, type: "text" },
      { key: "department", label: "Department", required: true, type: "text" },
      { key: "managerEmail", label: "Manager email", required: true, type: "text" },
    ],
    defaultTasks: ["Create mailbox", "Add to department distribution lists"],
  },
  {
    id: "sis-access",
    name: "Student Information System Access",
    description: "Grant access to the Student Information System (SIS).",
    fields: [
      { key: "employeeName", label: "Employee name", required: true, type: "text" },
      {
        key: "role",
        label: "SIS role",
        required: true,
        type: "select",
        options: ["Teacher", "Counselor", "Front office", "Administrator"],
      },
      { key: "buildings", label: "Building(s)", required: true, type: "text" },
      { key: "effectiveDate", label: "Effective date", required: false, type: "text" },
    ],
    defaultTasks: ["Provision SIS role", "Notify requester"],
  },
  {
    id: "software-install",
    name: "Software Install",
    description: "Install licensed software on a district device.",
    fields: [
      { key: "employeeName", label: "Employee name", required: true, type: "text" },
      { key: "softwareName", label: "Software name", required: true, type: "text" },
      { key: "deviceName", label: "Device name / asset tag", required: true, type: "text" },
      { key: "licenseJustification", label: "License justification", required: false, type: "text" },
    ],
    defaultTasks: ["Verify license availability", "Install software"],
  },
];

export function getCatalogItem(id: string): CatalogItem | undefined {
  return catalog.find((item) => item.id === id);
}
