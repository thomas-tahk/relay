import type { IntakeResult } from "@/domain/schema";

// The two hero scenarios, as intake results (the same shape the AI produces).
//
// PART OF THE RESKIN SEAM. Seeded into the store at startup so the fulfiller
// workspace is never empty — anyone opening the demo immediately sees a rich
// multi-item onboarding request and a routed incident, with no database and no
// API key required. Swap these (with the catalog) to stage a different demo.

export const demoSeed: IntakeResult[] = [
  {
    kind: "request",
    summary: "Onboard Priya Shah — new 5th-grade teacher, starts Monday",
    items: [
      {
        catalogItemId: "new-laptop",
        values: {
          employeeName: "Priya Shah",
          building: "Lincoln Elementary",
          model: "Standard laptop",
          justification: "New 5th-grade teacher starting Monday.",
        },
      },
      {
        catalogItemId: "email-account",
        values: {
          employeeName: "Priya Shah",
          department: "Elementary — Grade 5",
          managerEmail: "principal.lincoln@mesaverde.edu",
        },
      },
      {
        catalogItemId: "sis-access",
        values: {
          employeeName: "Priya Shah",
          role: "Teacher",
          buildings: "Lincoln Elementary",
          effectiveDate: "Monday (start of next week)",
        },
      },
      {
        catalogItemId: "software-install",
        values: {
          employeeName: "Priya Shah",
          softwareName: "Google Classroom + Seesaw",
          deviceName: "Priya Shah's new laptop",
          licenseJustification: "Standard grade-5 classroom software.",
        },
      },
    ],
  },
  {
    kind: "incident",
    shortDescription: "Projector in Room 12 won't turn on",
    category: "Classroom AV / Hardware",
    urgency: "high",
    affectedItem: "Room 12 projector",
  },
];
