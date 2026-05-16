export const jfxLabelStyles = String.raw`
:host {
  box-sizing: border-box;
  display: inline-flex;
  vertical-align: middle;
  font-family: var(--jfx-font-family, "Segoe UI", "SF Pro Text", system-ui, sans-serif);
  font-size: var(--jfx-font-size, 12px);
  color: var(--jfx-text-background-color, #333333);
  cursor: default;
  pointer-events: none;
}

:host([hidden]) {
  display: none;
}

.label {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  color: var(--jfx-text-background-color, #333333);
  font: inherit;
  line-height: 1.25;
  min-width: 0;
  text-align: start;
  white-space: nowrap;
}

:host([wrap-text]) .label {
  white-space: normal;
  overflow-wrap: anywhere;
}

:host([underline]) .label {
  text-decoration: underline;
}

:host([disabled]) {
  opacity: 0.4;
}

.text {
  min-width: 0;
}

.text[hidden],
slot[hidden] {
  display: none;
}

.mnemonic {
  text-decoration: underline;
  text-decoration-thickness: from-font;
}
`;

export const jfxLabelTemplate = String.raw`
<span class="label" part="label" data-label>
  <span class="text" part="text" data-text hidden></span>
  <slot></slot>
</span>
`;
