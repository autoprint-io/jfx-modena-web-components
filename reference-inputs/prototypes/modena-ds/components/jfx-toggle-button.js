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
    font: inherit;
    color: var(--jfx-text-base-color);
    padding: 0.333em 0.667em;
    min-width: 4em;

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

  /* ── Pressed ── */
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

  /* ── Selected (toggle ON) — inset/pressed appearance ──
     JavaFX uses a darker gradient with a darkened outer border
     to create the "pushed in" look */
  :host([selected]) button {
    background: linear-gradient(to bottom,
      var(--_sel-top, #cbcbcb),
      var(--_sel-mid, #d1d1d1));
    border-color: var(--_sel-border, #929292);
    box-shadow:
      inset 0 1px 0 0 var(--_sel-inner, #b9b9b9),
      0 1px 0 0 var(--jfx-shadow-highlight);
  }

  /* ── Selected + Hover ── */
  :host([selected]) button:hover {
    background: linear-gradient(to bottom,
      var(--_sel-top, #cbcbcb),
      var(--_sel-mid, #d1d1d1));
    filter: brightness(1.04);
  }

  /* ── Focus ── */
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

  :host([selected]:focus-visible) button {
    border-color: var(--jfx-focus-color);
    box-shadow:
      0 0 0 1.4px var(--jfx-faint-focus-color),
      inset 0 1px 0 0 var(--_sel-inner, #b9b9b9);
  }

  /* ── Disabled ── */
  :host([disabled]) button {
    opacity: 0.4;
    pointer-events: none;
  }

  ::slotted(svg),
  ::slotted(img) {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
  }
</style>
<button tabindex="-1" part="button"><slot></slot></button>
`;

class JfxToggleButton extends HTMLElement {
  static observedAttributes = ['selected', 'disabled'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._button = this.shadowRoot.querySelector('button');

    this._computeSelectedColors();
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKey);
    this._syncState();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onKey);
  }

  get selected() { return this.hasAttribute('selected'); }
  set selected(v) { v ? this.setAttribute('selected', '') : this.removeAttribute('selected'); }

  attributeChangedCallback(name) {
    if (name === 'disabled') this._syncDisabled();
    this._syncState();
  }

  _syncState() {
    this.setAttribute('aria-pressed', String(this.selected));
  }

  _syncDisabled() {
    const disabled = this.hasAttribute('disabled');
    this._button.disabled = disabled;
    this.setAttribute('tabindex', disabled ? '-1' : '0');
  }

  _onClick = () => {
    if (this.hasAttribute('disabled')) return;
    this.selected = !this.selected;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  _onKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this._onClick();
    }
  };

  _computeSelectedColors() {
    // JavaFX selected toggle: derive(-fx-color, -22%), -13%, -11%
    // Pre-computed from #ececec:
    // derive(#ececec, -22%) = B: 0.9255 * 0.78 = 0.7219 → gray(184) = #b8b8b8
    // derive(#ececec, -13%) = B: 0.9255 * 0.87 = 0.8052 → gray(205) = #cdcdcd
    // derive(#ececec, -11%) = B: 0.9255 * 0.89 = 0.8237 → gray(210) = #d2d2d2
    // outer-border: derive(derive(#ececec,-23%), -20%) = derive(#b6b6b6, -20%)
    //   #b6b6b6 B=0.7137, * 0.8 = 0.5710 → gray(146) = #929292
    this.style.setProperty('--_sel-top', '#b8b8b8');
    this.style.setProperty('--_sel-mid', '#d2d2d2');
    this.style.setProperty('--_sel-border', '#929292');
    this.style.setProperty('--_sel-inner', '#b9b9b9');
  }
}

customElements.define('jfx-toggle-button', JfxToggleButton);
