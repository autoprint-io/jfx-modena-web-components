import { JfxLabel } from "./jfx-label.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertDefaultAccessibleState(): void {
  const label = new JfxLabel();
  label.connectedCallback();

  assert(label.getAttribute("role") === "text", "label should expose the JavaFX TEXT role mapping.");
  assert(label.getAttribute("tabindex") === "-1", "label should not be normally tab-focusable.");
  assert(label.getAttribute("aria-disabled") === "false", "enabled label should expose aria-disabled=false.");
}

export function assertDisabledAccessibleStateRemainsNonFocusable(): void {
  const label = new JfxLabel();
  label.disabled = true;
  label.connectedCallback();

  assert(label.getAttribute("aria-disabled") === "true", "disabled label should expose aria-disabled=true.");
  assert(label.getAttribute("tabindex") === "-1", "disabled label should remain outside normal tab order.");
}

export function assertConservativeLabelForMapping(): void {
  const label = new JfxLabel();
  label.labelFor = "name-input";
  label.connectedCallback();

  assert(label.dataset.labelFor === "name-input", "label-for should be exposed as conservative host metadata.");
}
