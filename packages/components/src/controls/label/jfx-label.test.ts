import { defineJfxLabel, JfxLabel } from "./jfx-label.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertTextAttributeTakesPrecedenceOverSlot(): void {
  defineJfxLabel();

  const label = new JfxLabel();
  label.text = "Source text";
  label.textContent = "Slotted fallback";

  assert(label.shadowRoot?.textContent?.includes("Source text"), "text attribute should render in shadow text node.");
  assert(!label.shadowRoot?.textContent?.includes("Slotted fallback"), "slot fallback should be hidden when text is set.");
}

export function assertBooleanAttributeReflection(): void {
  const label = new JfxLabel();

  label.disabled = true;
  label.wrapText = true;
  label.underline = true;
  label.showMnemonics = true;

  assert(label.hasAttribute("disabled"), "disabled property should reflect to disabled attribute.");
  assert(label.hasAttribute("wrap-text"), "wrapText property should reflect to wrap-text attribute.");
  assert(label.hasAttribute("underline"), "underline property should reflect to underline attribute.");
  assert(label.hasAttribute("show-mnemonics"), "showMnemonics property should reflect to show-mnemonics attribute.");
}

export function assertMnemonicCleanupForTextAttribute(): void {
  const label = new JfxLabel();
  label.text = "_Name";
  label.showMnemonics = true;

  assert(label.shadowRoot?.textContent?.includes("Name"), "mnemonic marker should be removed from displayed text.");
  assert(label.shadowRoot?.querySelector("[part~='mnemonic']")?.textContent === "N", "mnemonic character should be exposed as a part when visible.");
}
