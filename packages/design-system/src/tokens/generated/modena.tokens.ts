export const modenaCss = String.raw`
:root,
:host {
  --jfx-base-font-size: 12px;
  --jfx-font-family: "Segoe UI", "SF Pro Text", system-ui, sans-serif;
  --jfx-font-size: var(--jfx-base-font-size);
  --jfx-base: #ececec;
  --jfx-background: #f1f1f1;
  --jfx-control-inner-background: #fbfbfb;
  --jfx-control-inner-background-alt: #f6f6f6;
  --jfx-dark-text-color: #000000;
  --jfx-mid-text-color: #333333;
  --jfx-light-text-color: #ffffff;
  --jfx-text-base-color: #333333;
  --jfx-text-background-color: #333333;
  --jfx-text-inner-color: #333333;
  --jfx-accent: #0096c9;
  --jfx-default-button: #abd8ed;
  --jfx-focus-color: #039ed3;
  --jfx-faint-focus-color: #039ed322;
  --jfx-shadow-highlight-color: rgba(255, 255, 255, 0.75);
  --jfx-outer-border: #b6b6b6;
  --jfx-inner-border-top: #f7f7f7;
  --jfx-inner-border-bottom: #e1e1e1;
  --jfx-body-color-top: #eeeeee;
  --jfx-body-color-bottom: #d9d9d9;
  --jfx-hover-body-color-top: #f5f5f5;
  --jfx-hover-body-color-bottom: #e0e0e0;
  --jfx-hover-outer-border: #bcbcbc;
  --jfx-pressed-body-color-top: #e1e1e1;
  --jfx-pressed-body-color-bottom: #cccccc;
  --jfx-pressed-outer-border: #ababab;
  --jfx-default-body-color-top: #acdaef;
  --jfx-default-body-color-bottom: #9dc7da;
  --jfx-default-outer-border: #84a6b6;
  --jfx-default-inner-border-top: #b3e2f8;
  --jfx-default-inner-border-bottom: #a3cee2;
}

.jfx-modena-root {
  background: var(--jfx-background);
  color: var(--jfx-text-background-color);
  font-family: var(--jfx-font-family);
  font-size: var(--jfx-font-size);
}
`;

export function adoptModenaTheme(target: Document | ShadowRoot = document): HTMLStyleElement {
  const style = document.createElement("style");
  style.dataset.jfxModena = "light";
  style.textContent = modenaCss;

  if (target instanceof Document) {
    target.head.append(style);
  } else {
    target.append(style);
  }

  return style;
}
