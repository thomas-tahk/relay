# Accessibility checklist

Accessibility is Relay's differentiator, so it is verified two ways: an
automated gate that runs on every `npm test`, and a manual walkthrough that a
person performs before a demo. This document is the manual half.

## Automated gate (runs in CI / `npm test`)

`tests/a11y/a11y.test.tsx` renders every key surface and runs the
[axe-core](https://github.com/dequelabs/axe-core) linter, asserting **zero
violations** for:

- the requester page (hero + intake form),
- the record preview (request and incident),
- the consolidated request tree (REQ → RITM → SCTASK),
- the deflection panel, the manual request form, and the display controls.

axe's `color-contrast` rule is disabled in this suite because jsdom has no
layout engine to measure rendered colors. Contrast is instead covered by the
manual pass below and by the **High contrast** display toggle.

## Manual keyboard walkthrough

Do this with the mouse pushed aside. Every control must be reachable and
operable with the keyboard alone.

- [ ] **Tab order is logical** on `/` — skips to the intake textarea, then the
      submit button, then the header links, in a sensible order.
- [ ] **Submit with the keyboard** — type a request, press **⌘/Ctrl + Enter**;
      the deflection panel (with a key) or the manual form (without) appears.
- [ ] **Deflection panel** — Tab to each suggestion; **Enter/Space** expands and
      collapses the article; the two action buttons are reachable and fire.
- [ ] **Clarify dialog** — when a required field is missing, the dialog opens
      with focus trapped inside it; **Esc** closes it; **Tab** cycles within it.
- [ ] **Manual form** — the request `Select` opens with **Enter/Space/↓**, options
      are chosen with the arrow keys, and every field has a visible label.
- [ ] **Workspace queue** — arrow keys move selection between records; the
      detail panel updates; focus is never lost.
- [ ] **Task checkboxes** — **Space** toggles a SCTASK; the change persists on
      reload.
- [ ] **Display menu** — the **Display** button opens the popover; **Tab** reaches
      both switches; **Space** toggles them; **Esc** closes.
- [ ] **Focus is always visible** — a clear focus ring follows every stop.

## Manual screen-reader walkthrough (VoiceOver on macOS: ⌘F5)

Run both hero scenarios end-to-end with the screen reader on.

- [ ] **Onboarding request** — describe "new 5th-grade teacher, Monday — laptop,
      email, SIS access, classroom software"; confirm the classification chip,
      each RITM, and the missing-field prompts are announced.
- [ ] **Projector incident** — describe "projector in room 12 won't turn on";
      confirm the Incident chip, urgency, and affected item are announced.
- [ ] **Landmarks** — header (`banner`), main content, and the workspace queue
      (`aria-label`) are navigable by landmark.
- [ ] **Names** — every button, link, switch, and field announces a meaningful
      name (no "button" with no label, no unlabeled graphics).
- [ ] **Live regions** — the classification result and the "Structuring…" status
      are announced when they appear (`aria-live="polite"`).

## Display preferences (low-vision north-star user)

- [ ] **High contrast** strengthens borders and secondary text; the setting
      persists across a reload and across navigation between `/` and
      `/workspace`.
- [ ] **Large text** scales the whole type system up without breaking layout.
- [ ] **Reduced motion** — with the OS "Reduce motion" setting on, the reveal
      and popover animations do not play.
