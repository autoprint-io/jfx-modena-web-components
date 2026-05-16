import { defineJfxCheckbox, JfxCheckbox } from "./jfx-checkbox.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertDefaultState(): void {
  defineJfxCheckbox();

  const checkbox = new JfxCheckbox();
  checkbox.connectedCallback();

  assert(checkbox.getAttribute("role") === "checkbox", "checkbox should expose checkbox role.");
  assert(checkbox.getAttribute("aria-checked") === "false", "default checkbox should be unchecked.");
  assert(checkbox.getAttribute("tabindex") === "0", "enabled checkbox should be focusable.");
}

export function assertTwoStateFireCycle(): void {
  const checkbox = new JfxCheckbox();
  checkbox.connectedCallback();

  checkbox.fire();
  assert(checkbox.checked, "fire should check an unchecked two-state checkbox.");
  assert(!checkbox.indeterminate, "two-state fire should keep indeterminate false.");

  checkbox.fire();
  assert(!checkbox.checked, "fire should uncheck a checked two-state checkbox.");
}

export function assertAllowIndeterminateCycle(): void {
  const checkbox = new JfxCheckbox();
  checkbox.allowIndeterminate = true;
  checkbox.connectedCallback();

  checkbox.fire();
  assert(checkbox.indeterminate, "allow-indeterminate fire should first enter mixed state.");

  checkbox.fire();
  assert(checkbox.checked && !checkbox.indeterminate, "mixed state fire should become checked determinate.");

  checkbox.fire();
  assert(!checkbox.checked && !checkbox.indeterminate, "checked fire should become unchecked determinate.");
}

export function assertDisabledSuppressesFire(): void {
  const checkbox = new JfxCheckbox();
  checkbox.disabled = true;
  checkbox.connectedCallback();
  checkbox.fire();

  assert(!checkbox.checked, "disabled checkbox should suppress fire.");
}
