import { expect, test, type Page } from "@playwright/test";

type LabelState = {
  customElementDefined: boolean;
  disabledAria: string | null;
  disabledOpacity: string;
  disabledTabIndex: string | null;
  labelCount: number;
  labelForDataset: string | null;
  labelForInternalDataset: string | null;
  labelRole: string | null;
  labelTabIndex: string | null;
  slotLabelText: string;
  textAttributeText: string;
};

async function getLabelShadowText(page: Page, id: string): Promise<string> {
  return page.locator(`#${id}`).evaluate((element) => {
    const shadowText = element.shadowRoot?.querySelector<HTMLElement>("[part~='text']");
    if (shadowText && !shadowText.hidden) {
      return shadowText.textContent?.replace(/\s+/g, " ").trim() ?? "";
    }

    return element.textContent?.replace(/\s+/g, " ").trim() ?? "";
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.customElements.get("jfx-label")));
});

test("renders jfx-label variants in a browser", async ({ page }) => {
  const state = await page.evaluate<LabelState>(() => {
    const getLabelText = (id: string): string => {
      const label = document.getElementById(id);
      const shadowText = label?.shadowRoot?.querySelector<HTMLElement>("[part~='text']");
      if (shadowText && !shadowText.hidden) {
        return shadowText.textContent?.replace(/\s+/g, " ").trim() ?? "";
      }

      return label?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    };

    return {
      customElementDefined: Boolean(window.customElements.get("jfx-label")),
      disabledAria: document.getElementById("disabled-label")?.getAttribute("aria-disabled") ?? null,
      disabledOpacity: window.getComputedStyle(document.getElementById("disabled-label") as Element).opacity,
      disabledTabIndex: document.getElementById("disabled-label")?.getAttribute("tabindex") ?? null,
      labelCount: document.querySelectorAll("jfx-label").length,
      labelForDataset: (document.getElementById("label-for") as HTMLElement | null)?.dataset.labelFor ?? null,
      labelForInternalDataset:
        document.getElementById("label-for")?.shadowRoot?.querySelector<HTMLElement>("[part~='label']")?.dataset.labelFor ??
        null,
      labelRole: document.getElementById("slot-label")?.getAttribute("role") ?? null,
      labelTabIndex: document.getElementById("slot-label")?.getAttribute("tabindex") ?? null,
      slotLabelText: getLabelText("slot-label"),
      textAttributeText: getLabelText("text-label"),
    };
  });

  expect(state.customElementDefined).toBe(true);
  expect(state.labelCount).toBe(9);
  expect(state.slotLabelText).toContain("Label");
  expect(state.textAttributeText).toContain("Source text");
  expect(state.labelRole).toBe("text");
  expect(state.labelTabIndex).toBe("-1");
  expect(state.disabledAria).toBe("true");
  expect(state.disabledOpacity).toBe("0.4");
  expect(state.disabledTabIndex).toBe("-1");
  expect(state.labelForDataset).toBe("fixture-name");
  expect(state.labelForInternalDataset).toBe("fixture-name");
});

test("text attribute takes precedence over slotted content", async ({ page }) => {
  const state = await page.locator("#precedence-label").evaluate((element) => {
    const text = element.shadowRoot?.querySelector<HTMLElement>("[part~='text']");
    const slot = element.shadowRoot?.querySelector<HTMLSlotElement>("slot");

    return {
      lightDomText: element.textContent?.trim() ?? "",
      renderedText: text?.textContent?.trim() ?? "",
      slotHidden: Boolean(slot?.hidden),
      textHidden: Boolean(text?.hidden),
    };
  });

  expect(state.lightDomText).toBe("Slotted fallback");
  expect(state.renderedText).toBe("Attribute text");
  expect(state.slotHidden).toBe(true);
  expect(state.textHidden).toBe(false);
});

test("renders mnemonic, escaped mnemonic, underline, and wrap states", async ({ page }) => {
  const mnemonicText = await page.locator("#mnemonic-label").evaluate((element) => {
    return element.shadowRoot?.querySelector("[part~='mnemonic']")?.textContent ?? "";
  });
  const visibleText = await getLabelShadowText(page, "mnemonic-label");
  const escapedVisibleText = await getLabelShadowText(page, "escaped-mnemonic-label");
  const escapedMnemonicCount = await page.locator("#escaped-mnemonic-label").evaluate((element) => {
    return element.shadowRoot?.querySelectorAll("[part~='mnemonic']").length ?? 0;
  });
  const underlineStyle = await page.locator("#underline-label").evaluate((element) => {
    const label = element.shadowRoot?.querySelector("[part~='label']");
    return label ? window.getComputedStyle(label).textDecorationLine : "";
  });
  const wrapStyle = await page.locator("#wrap-label").evaluate((element) => {
    const label = element.shadowRoot?.querySelector("[part~='label']");
    return label ? window.getComputedStyle(label).whiteSpace : "";
  });

  expect(visibleText).toContain("Name");
  expect(mnemonicText).toBe("N");
  expect(escapedVisibleText).toContain("Save_As");
  expect(escapedMnemonicCount).toBe(0);
  expect(underlineStyle).toContain("underline");
  expect(wrapStyle).toBe("normal");
});

test("reflects boolean and nullable properties at runtime", async ({ page }) => {
  const state = await page.evaluate(() => {
    const label = document.createElement("jfx-label") as HTMLElement & {
      disabled: boolean;
      labelFor: string | null;
      showMnemonics: boolean;
      text: string | null;
      underline: boolean;
      wrapText: boolean;
    };

    document.body.append(label);
    label.disabled = true;
    label.labelFor = "dynamic-target";
    label.showMnemonics = true;
    label.text = "_Dynamic";
    label.underline = true;
    label.wrapText = true;

    return {
      disabled: label.hasAttribute("disabled"),
      labelFor: label.getAttribute("label-for"),
      mnemonicText: label.shadowRoot?.querySelector("[part~='mnemonic']")?.textContent ?? "",
      showMnemonics: label.hasAttribute("show-mnemonics"),
      text: label.shadowRoot?.querySelector("[part~='text']")?.textContent ?? "",
      underline: label.hasAttribute("underline"),
      wrapText: label.hasAttribute("wrap-text"),
    };
  });

  expect(state.disabled).toBe(true);
  expect(state.labelFor).toBe("dynamic-target");
  expect(state.mnemonicText).toBe("D");
  expect(state.showMnemonics).toBe(true);
  expect(state.text).toBe("Dynamic");
  expect(state.underline).toBe(true);
  expect(state.wrapText).toBe(true);
});
