const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline-flex;
    vertical-align: middle;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
  }

  button {
    all: unset;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.333em;
    box-sizing: border-box;
    cursor: default;
    user-select: none;

    /* ── Typography ── */
    font: inherit;
    color: var(--jfx-text-base-color);

    /* ── Sizing (em-based, matches JavaFX) ── */
    padding: 0.333em 0.667em;
    min-width: 4em;

    /* ── Normal state: 4-layer Modena background system ──
       JavaFX layers: shadow-highlight | outer-border | inner-border | body-color
       Web equivalent: box-shadow (bottom highlight) | border | box-shadow (inset) | background */
    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top),
      var(--jfx-normal-body-bot));
    border: 1px solid var(--jfx-normal-outer-border);
    border-radius: 3px;
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      inset 0 -1px 0 0 var(--jfx-normal-inner-bot),
      0 1px 0 0 var(--jfx-shadow-highlight);
  }

  /* ── Hover ── */
  button:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top),
      var(--jfx-hover-body-bot));
    border-color: var(--jfx-hover-outer-border);
    box-shadow:
      inset 0 1px 0 0 var(--jfx-hover-inner-top),
      inset 0 -1px 0 0 var(--jfx-hover-inner-bot),
      0 1px 0 0 var(--jfx-shadow-highlight);
  }

  /* ── Pressed (JavaFX :armed) ── */
  button:active {
    background: linear-gradient(to bottom,
      var(--jfx-pressed-body-top),
      var(--jfx-pressed-body-bot));
    border-color: var(--jfx-pressed-outer-border);
    box-shadow:
      inset 0 1px 0 0 var(--jfx-pressed-inner-top),
      inset 0 -1px 0 0 var(--jfx-pressed-inner-bot),
      0 1px 0 0 var(--jfx-shadow-highlight);
  }

  /* ── Focus (host receives focus via tabindex, not the inner button) ── */
  :host(:focus-visible) button {
    border-color: var(--jfx-focus-color);
    box-shadow:
      0 0 0 1.4px var(--jfx-faint-focus-color),
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      inset 0 -1px 0 0 var(--jfx-normal-inner-bot);
  }
  :host(:focus-visible) {
    outline: none;
  }

  /* ── Disabled ── */
  :host([disabled]) button {
    opacity: 0.4;
    pointer-events: none;
  }

  /* ── Default button variant ── */
  :host([default]) button {
    background: linear-gradient(to bottom,
      var(--jfx-default-body-top),
      var(--jfx-default-body-bot));
    border-color: var(--jfx-default-outer-border);
    box-shadow:
      inset 0 1px 0 0 var(--jfx-default-inner-top),
      inset 0 -1px 0 0 var(--jfx-default-inner-bot),
      0 1px 0 0 var(--jfx-shadow-highlight);
  }
  :host([default]) button:hover {
    background: linear-gradient(to bottom,
      var(--jfx-default-hover-body-top),
      var(--jfx-default-hover-body-bot));
    border-color: var(--jfx-default-hover-outer-border);
  }
  :host([default]) button:active {
    background: linear-gradient(to bottom,
      var(--jfx-default-pressed-body-top),
      var(--jfx-default-pressed-body-bot));
    border-color: var(--jfx-default-pressed-outer-border);
    box-shadow:
      inset 0 1px 0 0 var(--jfx-default-inner-top),
      inset 0 -1px 0 0 var(--jfx-default-inner-bot),
      0 1px 0 0 var(--jfx-shadow-highlight);
  }
  :host([default]:focus-visible) button {
    border-color: var(--jfx-focus-color);
    box-shadow:
      0 0 0 1.4px var(--jfx-faint-focus-color),
      inset 0 1px 0 0 var(--jfx-default-inner-top),
      inset 0 -1px 0 0 var(--jfx-default-inner-bot);
  }

  /* ── Graphic slot ── */
  ::slotted(svg),
  ::slotted(img) {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
  }
</style>
<button tabindex="-1" part="button"><slot></slot></button>
`;

class JfxButton extends HTMLElement {
  static observedAttributes = ['disabled'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._button = this.shadowRoot.querySelector('button');
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this.addEventListener('keydown', this._onKey);
    this._syncDisabled();
  }

  disconnectedCallback() {
    this.removeEventListener('keydown', this._onKey);
  }

  _onKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this._button.click();
    }
  };

  attributeChangedCallback(name) {
    if (name === 'disabled') this._syncDisabled();
  }

  _syncDisabled() {
    const disabled = this.hasAttribute('disabled');
    this._button.disabled = disabled;
    this.setAttribute('tabindex', disabled ? '-1' : '0');
    this.setAttribute('aria-disabled', String(disabled));
  }
}

customElements.define('jfx-button', JfxButton);
