import { JfxElement, type JfxElementOptions } from "./jfx-element.js";

export abstract class JfxControl extends JfxElement {
  protected constructor(options: JfxElementOptions = {}) {
    super(options);
  }

  protected syncDisabledState(focusable = true): void {
    const disabled = this.hasAttribute("disabled");
    this.setAttribute("aria-disabled", String(disabled));
    this.setAttribute("tabindex", disabled || !focusable ? "-1" : "0");
  }
}
