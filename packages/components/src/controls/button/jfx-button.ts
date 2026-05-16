import { JfxControl } from "@autoprint/jfx-modena-runtime";
import { jfxButtonStyles, jfxButtonTemplate } from "./jfx-button.template.js";

export class JfxButton extends JfxControl {
  static observedAttributes = ["disabled"];

  private readonly button: HTMLButtonElement;
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.button.click();
    }
  };

  constructor() {
    super({
      styles: jfxButtonStyles,
      template: jfxButtonTemplate,
      delegatesFocus: true,
    });

    const button = this.root.querySelector<HTMLButtonElement>("button");
    if (!button) {
      throw new Error("jfx-button template must contain a button element.");
    }

    this.button = button;
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.setBooleanAttribute("disabled", value);
  }

  connectedCallback(): void {
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "button");
    }

    this.addEventListener("keydown", this.onKeyDown);
    this.syncState();
  }

  disconnectedCallback(): void {
    this.removeEventListener("keydown", this.onKeyDown);
  }

  attributeChangedCallback(): void {
    this.syncState();
  }

  private syncState(): void {
    this.syncDisabledState();
    this.button.disabled = this.disabled;
  }
}

export function defineJfxButton(): void {
  if (!customElements.get("jfx-button")) {
    customElements.define("jfx-button", JfxButton);
  }
}
