import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    __jfxCheckboxEvents: Array<{ checked: boolean; indeterminate: boolean; selected: boolean }>;
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.customElements.get("jfx-checkbox")));
});

test("renders jfx-checkbox variants in a browser", async ({ page }) => {
  const state = await page.evaluate(() => {
    const checkbox = document.getElementById("checkbox-slot");
    const checked = document.getElementById("checkbox-checked");
    const indeterminate = document.getElementById("checkbox-indeterminate");
    const disabled = document.getElementById("checkbox-disabled");

    return {
      checkedAria: checked?.getAttribute("aria-checked") ?? null,
      checkboxCount: document.querySelectorAll("jfx-checkbox").length,
      customElementDefined: Boolean(window.customElements.get("jfx-checkbox")),
      disabledAria: disabled?.getAttribute("aria-disabled") ?? null,
      disabledOpacity: window.getComputedStyle(disabled as Element).opacity,
      disabledTabIndex: disabled?.getAttribute("tabindex") ?? null,
      indeterminateAria: indeterminate?.getAttribute("aria-checked") ?? null,
      role: checkbox?.getAttribute("role") ?? null,
      slotText: checkbox?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      tabIndex: checkbox?.getAttribute("tabindex") ?? null,
    };
  });

  expect(state.customElementDefined).toBe(true);
  expect(state.checkboxCount).toBe(7);
  expect(state.role).toBe("checkbox");
  expect(state.tabIndex).toBe("0");
  expect(state.slotText).toBe("CheckBox");
  expect(state.checkedAria).toBe("true");
  expect(state.indeterminateAria).toBe("mixed");
  expect(state.disabledAria).toBe("true");
  expect(state.disabledOpacity).toBe("0.4");
  expect(state.disabledTabIndex).toBe("-1");
});

test("toggles checked state with click and keyboard", async ({ page }) => {
  const checkbox = page.locator("#checkbox-slot");
  await checkbox.evaluate((element) => {
    window.__jfxCheckboxEvents = [];
    element.addEventListener("jfx-change", (event) => {
      window.__jfxCheckboxEvents.push((event as CustomEvent).detail);
    });
  });

  await checkbox.click();
  await expect(checkbox).toHaveAttribute("checked", "");
  await expect(checkbox).toHaveAttribute("aria-checked", "true");

  await checkbox.press("Space");
  await expect(checkbox).not.toHaveAttribute("checked", "");
  await expect(checkbox).toHaveAttribute("aria-checked", "false");

  const events = await page.evaluate(() => window.__jfxCheckboxEvents);
  expect(events).toEqual([
    { checked: true, indeterminate: false, selected: true },
    { checked: false, indeterminate: false, selected: false },
  ]);
});

test("emits jfx-change details and suppresses disabled fire", async ({ page }) => {
  const state = await page.evaluate(() => {
    const checkbox = document.getElementById("checkbox-text") as HTMLElement & { fire(): void };
    const disabled = document.getElementById("checkbox-disabled") as HTMLElement & { fire(): void };
    const events: unknown[] = [];

    checkbox.addEventListener("jfx-change", (event) => {
      events.push((event as CustomEvent).detail);
    });

    checkbox.fire();
    disabled.fire();

    return {
      checked: checkbox.hasAttribute("checked"),
      disabledChecked: disabled.hasAttribute("checked"),
      events,
    };
  });

  expect(state.checked).toBe(true);
  expect(state.disabledChecked).toBe(false);
  expect(state.events).toEqual([{ checked: true, indeterminate: false, selected: true }]);
});

test("cycles through indeterminate state when allowed", async ({ page }) => {
  const checkbox = page.locator("#checkbox-allow-indeterminate");

  await checkbox.click();
  await expect(checkbox).toHaveAttribute("indeterminate", "");
  await expect(checkbox).toHaveAttribute("aria-checked", "mixed");

  await checkbox.click();
  await expect(checkbox).toHaveAttribute("checked", "");
  await expect(checkbox).not.toHaveAttribute("indeterminate", "");
  await expect(checkbox).toHaveAttribute("aria-checked", "true");

  await checkbox.click();
  await expect(checkbox).not.toHaveAttribute("checked", "");
  await expect(checkbox).not.toHaveAttribute("indeterminate", "");
  await expect(checkbox).toHaveAttribute("aria-checked", "false");
});

test("renders mnemonic text and reflects runtime properties", async ({ page }) => {
  const mnemonic = await page.locator("#checkbox-mnemonic").evaluate((element) => {
    return {
      ariaLabel: element.getAttribute("aria-label"),
      mnemonicText: element.shadowRoot?.querySelector("[part~='mnemonic']")?.textContent ?? "",
      text: element.shadowRoot?.querySelector("[part~='text']")?.textContent ?? "",
    };
  });

  expect(mnemonic.ariaLabel).toBe("Option");
  expect(mnemonic.mnemonicText).toBe("O");
  expect(mnemonic.text).toBe("Option");

  const dynamic = await page.evaluate(() => {
    const checkbox = document.createElement("jfx-checkbox") as HTMLElement & {
      allowIndeterminate: boolean;
      checked: boolean;
      indeterminate: boolean;
      selected: boolean;
      showMnemonics: boolean;
      text: string | null;
    };

    document.body.append(checkbox);
    checkbox.allowIndeterminate = true;
    checkbox.checked = true;
    checkbox.indeterminate = true;
    checkbox.showMnemonics = true;
    checkbox.text = "_Dynamic";

    return {
      allowIndeterminate: checkbox.hasAttribute("allow-indeterminate"),
      ariaChecked: checkbox.getAttribute("aria-checked"),
      checked: checkbox.hasAttribute("checked"),
      indeterminate: checkbox.hasAttribute("indeterminate"),
      mnemonicText: checkbox.shadowRoot?.querySelector("[part~='mnemonic']")?.textContent ?? "",
      selected: checkbox.selected,
    };
  });

  expect(dynamic.allowIndeterminate).toBe(true);
  expect(dynamic.checked).toBe(true);
  expect(dynamic.indeterminate).toBe(true);
  expect(dynamic.ariaChecked).toBe("mixed");
  expect(dynamic.mnemonicText).toBe("D");
  expect(dynamic.selected).toBe(true);
});
