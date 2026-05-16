export const jfxButtonStyles = String.raw`
:host {
  display: inline-flex;
  vertical-align: middle;
  font-family: var(--jfx-font-family, "Segoe UI", system-ui, sans-serif);
  font-size: var(--jfx-font-size, 12px);
  color: var(--jfx-text-base-color, #333333);
}

.button {
  appearance: none;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4em;
  min-height: calc(1em + 0.666666em + 2px);
  padding: 0.333333em 0.666667em;
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
  color: inherit;
  cursor: default;
  font: inherit;
  line-height: 1.25;
  user-select: none;
  white-space: nowrap;
}

.button:hover {
  border-color: var(--jfx-hover-outer-border, #bcbcbc);
  background:
    linear-gradient(
      to bottom,
      var(--jfx-hover-body-color-top, #f5f5f5),
      var(--jfx-hover-body-color-bottom, #e0e0e0)
    );
}

.button:active,
:host([pressed]) .button {
  border-color: var(--jfx-pressed-outer-border, #ababab);
  background:
    linear-gradient(
      to bottom,
      var(--jfx-pressed-body-color-top, #e1e1e1),
      var(--jfx-pressed-body-color-bottom, #cccccc)
    );
}

:host([default]) .button {
  border-color: var(--jfx-default-outer-border, #84a6b6);
  background:
    linear-gradient(
      to bottom,
      var(--jfx-default-body-color-top, #acdaef),
      var(--jfx-default-body-color-bottom, #9dc7da)
    );
  box-shadow:
    inset 0 1px 0 var(--jfx-default-inner-border-top, #b3e2f8),
    inset 0 -1px 0 var(--jfx-default-inner-border-bottom, #a3cee2),
    0 1px 0 var(--jfx-shadow-highlight-color, rgba(255, 255, 255, 0.75));
}

:host(:focus-visible) {
  outline: none;
}

:host(:focus-visible) .button {
  border-color: var(--jfx-focus-color, #039ed3);
  box-shadow:
    0 0 0 1.4px var(--jfx-faint-focus-color, #039ed322),
    inset 0 1px 0 var(--jfx-inner-border-top, #f7f7f7),
    inset 0 -1px 0 var(--jfx-inner-border-bottom, #e1e1e1);
}

:host([disabled]) {
  opacity: 0.4;
  pointer-events: none;
}
`;

export const jfxButtonTemplate = String.raw`
<button class="button" part="button" tabindex="-1" type="button">
  <slot></slot>
</button>
`;
