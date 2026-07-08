// The branding half of the reskin seam (the catalog is the other half).
//
// Swap this file plus config/catalog.ts to retarget Relay at a new organization
// or domain for a specific demo — the engine and UI read from here, so nothing
// in src/ changes. `productName` names the tool; `org` names who it's deployed
// for; `tagline` trails the title tab.

export interface Branding {
  productName: string;
  tagline: string;
  org: string;
}

export const branding: Branding = {
  productName: "Relay",
  tagline: "plain-language IT requests",
  org: "Mesa Verde Unified School District",
};
