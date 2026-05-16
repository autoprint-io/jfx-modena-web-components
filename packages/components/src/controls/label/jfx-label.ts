import { JfxControl } from "@autoprint/jfx-modena-runtime";
import { jfxLabelStyles, jfxLabelTemplate } from "./jfx-label.template.js";

type MnemonicText = {
  displayText: string;
  mnemonicIndex: number;
};

const observedAttributes = [
  "disabled",
  "label-for",
  "show-mnemonics",
  "text",
  "underline",
  "wrap-text",
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

export class JfxLabel extends JfxControl {
  static observedAttributes = observedAttributes;

  private readonly label: HTMLElement;
  private readonly textNode: HTMLElement;
  private readonly defaultSlot: HTMLSlotElement;

  constructor() {
    super({
      styles: jfxLabelStyles,
      template: jfxLabelTemplate,
    });

    const label = this.root.querySelector<HTMLElement>("[data-label]");
    const textNode = this.root.querySelector<HTMLElement>("[data-text]");
    const slot = this.root.querySelector<HTMLSlotElement>("slot");

    if (!label || !textNode || !slot) {
      throw new Error("jfx-label template must contain label, text, and slot elements.");
    }

    this.label = label;
    this.textNode = textNode;
    this.defaultSlot = slot;
  }

  get disabled(): boolean {
    return this.hasBooleanAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.setBooleanAttribute("disabled", value);
  }

  get labelFor(): string {
    return this.getAttribute("label-for") ?? "";
  }

  set labelFor(value: string | null) {
    this.setNullableAttribute("label-for", value);
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
    this.setNullableAttribute("text", value);
  }

  get underline(): boolean {
    return this.hasBooleanAttribute("underline");
  }

  set underline(value: boolean) {
    this.setBooleanAttribute("underline", value);
  }

  get wrapText(): boolean {
    return this.hasBooleanAttribute("wrap-text");
  }

  set wrapText(value: boolean) {
    this.setBooleanAttribute("wrap-text", value);
  }

  connectedCallback(): void {
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "text");
    }

    this.syncState();
  }

  attributeChangedCallback(): void {
    this.syncState();
  }

  private setNullableAttribute(name: string, value: string | null): void {
    if (value === null) {
      this.removeAttribute(name);
    } else {
      this.setAttribute(name, value);
    }
  }

  private syncState(): void {
    this.syncDisabledState(false);
    this.syncLabelFor();
    this.syncText();
  }

  private syncLabelFor(): void {
    const labelFor = this.labelFor;
    if (labelFor) {
      this.dataset.labelFor = labelFor;
      this.label.dataset.labelFor = labelFor;
    } else {
      delete this.dataset.labelFor;
      delete this.label.dataset.labelFor;
    }
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
}

export function defineJfxLabel(): void {
  if (!customElements.get("jfx-label")) {
    customElements.define("jfx-label", JfxLabel);
  }
}
