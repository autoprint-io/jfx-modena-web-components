import { JfxCheckbox } from "./jfx-checkbox.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertAccessibleCheckedStates(): void {
  const checkbox = new JfxCheckbox();
  checkbox.connectedCallback();

  assert(checkbox.getAttribute("role") === "checkbox", "checkbox should expose checkbox role.");
  assert(checkbox.getAttribute("aria-checked") === "false", "unchecked checkbox should expose aria-checked=false.");

  checkbox.checked = true;
  assert(checkbox.getAttribute("aria-checked") === "true", "checked checkbox should expose aria-checked=true.");

  checkbox.indeterminate = true;
  assert(checkbox.getAttribute("aria-checked") === "mixed", "indeterminate checkbox should expose aria-checked=mixed.");
}

export function assertDisabledAccessibleState(): void {
  const checkbox = new JfxCheckbox();
  checkbox.disabled = true;
  checkbox.connectedCallback();

  assert(checkbox.getAttribute("aria-disabled") === "true", "disabled checkbox should expose aria-disabled=true.");
  assert(checkbox.getAttribute("tabindex") === "-1", "disabled checkbox should leave tab order.");
}

export function assertTextBecomesAccessibleName(): void {
  const checkbox = new JfxCheckbox();
  checkbox.text = "_Enable";
  checkbox.connectedCallback();

  assert(checkbox.getAttribute("aria-label") === "Enable", "text should generate a mnemonic-clean accessible label.");
}
