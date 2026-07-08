"use client";

import { useEffect, useState } from "react";
import { Button, Dialog, DialogTrigger, Popover, Switch } from "react-aria-components";

// Persisted display preferences for the low-vision north-star user. Applied as
// data attributes on <html> so the whole app (both pages) responds, and mounted
// in every header so the choice survives navigation.
const CONTRAST_KEY = "relay:contrast";
const TEXT_KEY = "relay:text";

export function DisplayControls() {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

  // Load saved preferences once, on mount.
  useEffect(() => {
    setHighContrast(localStorage.getItem(CONTRAST_KEY) === "on");
    setLargeText(localStorage.getItem(TEXT_KEY) === "on");
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.toggleAttribute("data-contrast-high", highContrast);
    localStorage.setItem(CONTRAST_KEY, highContrast ? "on" : "off");
  }, [highContrast]);

  useEffect(() => {
    const root = document.documentElement;
    root.toggleAttribute("data-text-large", largeText);
    localStorage.setItem(TEXT_KEY, largeText ? "on" : "off");
  }, [largeText]);

  const activeCount = Number(highContrast) + Number(largeText);

  return (
    <DialogTrigger>
      <Button className="header-link display-btn" aria-label="Display settings">
        <span aria-hidden="true">◐</span> Display
        {activeCount > 0 && <span className="display-badge">{activeCount}</span>}
      </Button>
      <Popover className="display-popover" placement="bottom end">
        <Dialog className="display-dialog" aria-label="Display settings">
          <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
            Display
          </p>
          <Switch className="switch" isSelected={highContrast} onChange={setHighContrast}>
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
            <span className="switch-label">High contrast</span>
          </Switch>
          <Switch className="switch" isSelected={largeText} onChange={setLargeText}>
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
            <span className="switch-label">Large text</span>
          </Switch>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
