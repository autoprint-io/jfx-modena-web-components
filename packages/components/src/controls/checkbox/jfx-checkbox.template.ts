export const jfxCheckboxStyles = String.raw`
:host {
  box-sizing: border-box;
  display: inline-flex;
  vertical-align: middle;
  font-family: var(--jfx-font-family, "Segoe UI", "SF Pro Text", system-ui, sans-serif);
  font-size: var(--jfx-font-size, 12px);
  color: var(--jfx-text-background-color, #333333);
  cursor: default;
  user-select: none;
}

:host([hidden]) {
  display: none;
}

:host(:focus-visible) {
  outline: none;
}

:host([disabled]) {
  opacity: 0.4;
  pointer-events: none;
}

.check-box {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  color: inherit;
  font: inherit;
  line-height: 1.25;
  min-width: 0;
}

.box {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 1.333333em;
  height: 1.333333em;
  margin-inline-end: 0.416667em;
  border: 1px solid var(--jfx-outer-border, #b6b6b6);
  border-radius: 3px;
  background:
    linear-gradient(
      to bottom,
      var(--jfx-body-color-top, #eeeeee),
      var(--jfx-body-color-bottom, #d9d9d9)
    );
  box-shadow:
    inset 0 1px 0 var(--jfx-inner-border-top, #f7f7f7),
    inset 0 -1px 0 var(--jfx-inner-border-bottom, #e1e1e1),
    0 1px 0 var(--jfx-shadow-highlight-color, rgba(255, 255, 255, 0.75));
}

:host(:hover) .box {
  border-color: var(--jfx-hover-outer-border, #bcbcbc);
  background:
    linear-gradient(
      to bottom,
      var(--jfx-hover-body-color-top, #f5f5f5),
      var(--jfx-hover-body-color-bottom, #e0e0e0)
    );
}

:host([pressed]) .box {
  border-color: var(--jfx-pressed-outer-border, #ababab);
  background:
    linear-gradient(
      to bottom,
      var(--jfx-pressed-body-color-top, #e1e1e1),
      var(--jfx-pressed-body-color-bottom, #cccccc)
    );
}

:host(:focus-visible) .box {
  border-color: var(--jfx-focus-color, #039ed3);
  box-shadow:
    0 0 0 1.4px var(--jfx-faint-focus-color, #039ed322),
    inset 0 1px 0 var(--jfx-inner-border-top, #f7f7f7),
    inset 0 -1px 0 var(--jfx-inner-border-bottom, #e1e1e1);
}

.mark {
  box-sizing: border-box;
  display: block;
  opacity: 0;
  width: 0.666667em;
  height: 0.416667em;
  border-color: var(--jfx-mark-color, #5f5f5f);
  border-style: solid;
  border-width: 0 0 0.166667em 0.166667em;
  transform: translateY(-0.083333em) rotate(-45deg);
}

:host([checked]) .mark,
:host([indeterminate]) .mark {
  opacity: 1;
}

:host([indeterminate]) .mark {
  width: 0.666667em;
  height: 0.166667em;
  border: 0;
  background: var(--jfx-mark-color, #5f5f5f);
  transform: none;
}

.text {
  min-width: 0;
  white-space: nowrap;
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

export const jfxCheckboxTemplate = String.raw`
<span class="check-box" part="label" data-label>
  <span class="box" part="box" data-box>
    <span class="mark" part="mark" data-mark></span>
  </span>
  <span class="text" part="text" data-text hidden></span>
  <slot></slot>
</span>
`;
