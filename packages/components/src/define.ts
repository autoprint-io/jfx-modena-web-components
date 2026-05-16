import { defineJfxButton } from "./controls/button/jfx-button.js";
import { defineJfxCheckbox } from "./controls/checkbox/jfx-checkbox.js";
import { defineJfxLabel } from "./controls/label/jfx-label.js";

export function defineJfxModenaComponents(): void {
  defineJfxButton();
  defineJfxCheckbox();
  defineJfxLabel();
}
