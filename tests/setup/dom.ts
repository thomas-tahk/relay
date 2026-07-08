// Polyfills React Aria relies on that jsdom does not implement. Guarded so this
// file is a no-op under the default node test environment (only the a11y tests
// opt into jsdom via a per-file `@vitest-environment jsdom` docblock).
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
  }

  for (const name of ["ResizeObserver", "IntersectionObserver"] as const) {
    if (!(name in window)) {
      (window as unknown as Record<string, unknown>)[name] = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }

  afterEach(() => cleanup());
}
