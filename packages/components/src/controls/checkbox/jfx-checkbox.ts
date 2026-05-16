import { JfxControl } from "@autoprint/jfx-modena-runtime";
import { jfxCheckboxStyles, jfxCheckboxTemplate } from "./jfx-checkbox.template.js";

type MnemonicText = {
  displayText: string;
  mnemonicIndex: number;
};

const observedAttributes = [
  "allow-indeterminate",
  "checked",
  "disabled",
  "indeterminate",
  "show-mnemonics",
  "text",
];

function parseMnemonicText(value: string): MnemonicText {
  let displayText = "";
  let mnemonicIndex = -1;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const nextCharacter = value[index + 1];

    if (character === "_" && nextCharacter) {
      if (nextCharacter === "_") {
        displayText += "_";
        index += 1;
      } else {
        if (mnemonicIndex === -1) {
          mnemonicIndex = displayText.length;
        }
        displayText += nextCharacter;
        index += 1;
      }
    } else {
      displayText += character;
    }
  }

  return { displayText, mnemonicIndex };
}

export type JfxCheckboxChangeDetail = {
  checked: boolean;
  indeterminate: boolean;
  selected: boolean;
};

export class JfxCheckbox extends JfxControl {
  static observedAttributes = observedAttributes;

  private readonly textNode: HTMLElement;
  private readonly defaultSlot: HTMLSlotElement;
  private generatedAriaLabel = false;
  private keyDown = false;

  private readonly onClick = (event: MouseEvent): void => {
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    this.fire();
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled || (event.key !== " " && event.key !== "Enter")) {
      return;
    }

    event.preventDefault();
    if (!event.repeat) {
      this.keyDown = true;
      this.pressed = true;
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (event.key !== " " && event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    if (this.disabled || !this.keyDown) {
      this.keyDown = false;
      this.pressed = false;
      return;
    }

    this.keyDown = false;
    this.pressed = false;
    this.fire();
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (this.disabled || event.button !== 0) {
      return;
    }

    this.pressed = true;
  };

  private readonly onPointerUp = (): void => {
    this.pressed = false;
  };

  private readonly onPointerLeave = (): void => {
    this.pressed = false;
  };

  private readonly onSlotChange = (): void => {
    this.syncAccessibleName();
  };

  constructor() {
    super({
      styles: jfxCheckboxStyles,
      template: jfxCheckboxTemplate,
    });

    const textNode = this.root.querySelector<HTMLElement>("[data-text]");
    const slot = this.root.querySelector<HTMLSlotElement>("slot");

    if (!textNode || !slot) {
      throw new Error("jfx-checkbox template must contain text and slot elements.");
    }

    this.textNode = textNode;
    this.defaultSlot = slot;
  }

  get allowIndeterminate(): boolean {
    return this.hasBooleanAttribute("allow-indeterminate");
  }

  set allowIndeterminate(value: boolean) {
    this.setBooleanAttribute("allow-indeterminate", value);
  }

  get checked(): boolean {
    return this.hasBooleanAttribute("checked");
  }

  set checked(value: boolean) {
    this.setBooleanAttribute("checked", value);
  }

  get selected(): boolean {
    return this.checked;
  }

  set selected(value: boolean) {
    this.checked = value;
  }

  get disabled(): boolean {
    return this.hasBooleanAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.setBooleanAttribute("disabled", value);
  }

  get indeterminate(): boolean {
    return this.hasBooleanAttribute("indeterminate");
  }

  set indeterminate(value: boolean) {
    this.setBooleanAttribute("indeterminate", value);
  }

  get pressed(): boolean {
    return this.hasBooleanAttribute("pressed");
  }

  set pressed(value: boolean) {
    this.setBooleanAttribute("pressed", value);
  }

  get showMnemonics(): boolean {
    return this.hasBooleanAttribute("show-mnemonics");
  }

  set showMnemonics(value: boolean) {
    this.setBooleanAttribute("show-mnemonics", value);
  }

  get text(): string {
    return this.getAttribute("text") ?? "";
  }

  set text(value: string | null) {
    if (value === null) {
      this.removeAttribute("text");
    } else {
      this.setAttribute("text", value);
    }
  }

  connectedCallback(): void {
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "checkbox");
    }

    this.addEventListener("click", this.onClick);
    this.addEventListener("keydown", this.onKeyDown);
    this.addEventListener("keyup", this.onKeyUp);
    this.addEventListener("pointerdown", this.onPointerDown);
    this.addEventListener("pointerup", this.onPointerUp);
    this.addEventListener("pointerleave", this.onPointerLeave);
    this.defaultSlot.addEventListener("slotchange", this.onSlotChange);
    this.syncState();
  }

  disconnectedCallback(): void {
    this.removeEventListener("click", this.onClick);
    this.removeEventListener("keydown", this.onKeyDown);
    this.removeEventListener("keyup", this.onKeyUp);
    this.removeEventListener("pointerdown", this.onPointerDown);
    this.removeEventListener("pointerup", this.onPointerUp);
    this.removeEventListener("pointerleave", this.onPointerLeave);
    this.defaultSlot.removeEventListener("slotchange", this.onSlotChange);
  }

  attributeChangedCallback(): void {
    this.syncState();
  }

  fire(): void {
    if (this.disabled) {
      return;
    }

    if (this.allowIndeterminate) {
      if (!this.checked && !this.indeterminate) {
        this.indeterminate = true;
      } else if (this.checked && !this.indeterminate) {
        this.checked = false;
      } else if (this.indeterminate) {
        this.checked = true;
        this.indeterminate = false;
      }
    } else {
      this.checked = !this.checked;
      this.indeterminate = false;
    }

    const detail = this.makeChangeDetail();
    this.dispatchEvent(new CustomEvent<JfxCheckboxChangeDetail>("jfx-change", { bubbles: true, composed: true, detail }));
    this.dispatchEvent(new CustomEvent<JfxCheckboxChangeDetail>("jfx-action", { bubbles: true, composed: true, detail }));
  }

  private syncState(): void {
    this.syncDisabledState();
    this.setAttribute("aria-checked", this.indeterminate ? "mixed" : String(this.checked));
    this.syncText();
    this.syncAccessibleName();
  }

  private syncText(): void {
    const hasTextAttribute = this.hasAttribute("text");
    this.textNode.hidden = !hasTextAttribute;
    this.defaultSlot.hidden = hasTextAttribute;

    if (!hasTextAttribute) {
      this.textNode.replaceChildren();
      return;
    }

    const { displayText, mnemonicIndex } = parseMnemonicText(this.getAttribute("text") ?? "");
    this.textNode.replaceChildren(...this.makeTextNodes(displayText, mnemonicIndex));
  }

  private syncAccessibleName(): void {
    if (this.hasAttribute("aria-labelledby")) {
      this.removeGeneratedAriaLabel();
      return;
    }

    if (this.hasAttribute("aria-label") && !this.generatedAriaLabel) {
      return;
    }

    const label = this.getAccessibleText();
    if (label) {
      this.generatedAriaLabel = true;
      this.setAttribute("aria-label", label);
    } else {
      this.removeGeneratedAriaLabel();
    }
  }

  private getAccessibleText(): string {
    if (this.hasAttribute("text")) {
      return parseMnemonicText(this.getAttribute("text") ?? "").displayText.trim();
    }

    return this.textContent?.replace(/\s+/g, " ").trim() ?? "";
  }

  private removeGeneratedAriaLabel(): void {
    if (this.generatedAriaLabel) {
      this.generatedAriaLabel = false;
      this.removeAttribute("aria-label");
    }
  }

  private makeTextNodes(displayText: string, mnemonicIndex: number): Node[] {
    if (!this.showMnemonics || mnemonicIndex < 0 || mnemonicIndex >= displayText.length) {
      return [document.createTextNode(displayText)];
    }

    const mnemonic = document.createElement("span");
    mnemonic.className = "mnemonic";
    mnemonic.part.add("mnemonic");
    mnemonic.textContent = displayText[mnemonicIndex];

    return [
      document.createTextNode(displayText.slice(0, mnemonicIndex)),
      mnemonic,
      document.createTextNode(displayText.slice(mnemonicIndex + 1)),
    ];
  }

  private makeChangeDetail(): JfxCheckboxChangeDetail {
    return {
      checked: this.checked,
      indeterminate: this.indeterminate,
      selected: this.checked,
    };
  }
}

export function defineJfxCheckbox(): void {
  if (!customElements.get("jfx-checkbox")) {
    customElements.define("jfx-checkbox", JfxCheckbox);
  }
}
