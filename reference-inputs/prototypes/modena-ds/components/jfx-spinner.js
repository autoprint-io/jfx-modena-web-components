const SVG_UP = `<svg viewBox="0 0 7 4" xmlns="http://www.w3.org/2000/svg"><path d="M0 4h7L3.5 0z" fill="var(--jfx-mark-color)"/></svg>`;
const SVG_DN = `<svg viewBox="0 0 7 4" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h7L3.5 4z" fill="var(--jfx-mark-color)"/></svg>`;

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline-flex;
    vertical-align: middle;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    min-width: 8em;
  }

  /* ── Outer wrapper: unified border around the entire spinner ──
     In JavaFX, .spinner itself has the text-box-border + inner bg.
     Focus wraps the whole component with the blue ring + glow. */
  .wrapper {
    display: flex;
    width: 100%;
    border: 1px solid var(--jfx-text-box-border);
    border-top-color: var(--jfx-text-box-border-top);
    border-radius: 3px;
    overflow: hidden;
    background: linear-gradient(to bottom,
      var(--jfx-control-inner-shadow) 0px,
      var(--jfx-control-inner-bg) 5px);
  }

  /* ── Focus: blue ring + glow wraps entire component ── */
  :host(:focus-within) .wrapper {
    border-color: var(--jfx-focus-color);
    box-shadow: 0 0 0 1.4px var(--jfx-faint-focus-color);
  }

  /* ── Text field (left): no own border, blends into wrapper ── */
  input {
    all: unset;
    flex: 1;
    min-width: 0;
    box-sizing: border-box;
    font: inherit;
    color: var(--jfx-text-inner-color);
    text-align: center;
    cursor: text;
    background: transparent;
    padding: 0.333em 0.583em;
  }

  input:focus { outline: none; }

  /* ── Buttons column (right) ── */
  .buttons {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    border-left: 1px solid var(--jfx-normal-outer-border);
  }

  .btn {
    all: unset;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    cursor: default;
    padding: 0.333em 0.667em;

    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top),
      var(--jfx-normal-body-bot));
    border-left: none;
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      inset 0 -1px 0 0 var(--jfx-normal-inner-bot);
  }

  .btn-up {
    border-bottom: 1px solid var(--jfx-normal-outer-border);
  }

  .btn:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top),
      var(--jfx-hover-body-bot));
  }

  .btn:active {
    background: linear-gradient(to bottom,
      var(--jfx-pressed-body-top),
      var(--jfx-pressed-body-bot));
  }

  .arrow {
    width: 0.667em;
    height: 0.333em;
    line-height: 0;
  }
  .arrow svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  :host([disabled]) {
    opacity: 0.4;
    pointer-events: none;
  }
</style>
<div class="wrapper" part="wrapper">
  <input part="input" type="text" inputmode="numeric">
  <div class="buttons">
    <button class="btn btn-up" tabindex="-1" part="increment">
      <span class="arrow">${SVG_UP}</span>
    </button>
    <button class="btn btn-down" tabindex="-1" part="decrement">
      <span class="arrow">${SVG_DN}</span>
    </button>
  </div>
</div>
`;

class JfxSpinner extends HTMLElement {
  static observedAttributes = ['value', 'min', 'max', 'step', 'disabled'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._input = this.shadowRoot.querySelector('input');
    this._btnUp = this.shadowRoot.querySelector('.btn-up');
    this._btnDown = this.shadowRoot.querySelector('.btn-down');
  }

  connectedCallback() {
    this.setAttribute('role', 'spinbutton');
    this._syncValue();
    this._btnUp.addEventListener('click', () => this._step(1));
    this._btnDown.addEventListener('click', () => this._step(-1));
    this._input.addEventListener('change', this._onInputChange);
    this._input.addEventListener('keydown', this._onKey);
  }

  get min() { return parseFloat(this.getAttribute('min')) ?? 0; }
  get max() { return parseFloat(this.getAttribute('max')) ?? 100; }
  get step() { return parseFloat(this.getAttribute('step')) || 1; }
  get value() { return parseFloat(this.getAttribute('value')) || 0; }
  set value(v) { this.setAttribute('value', String(v)); }

  attributeChangedCallback() { this._syncValue(); }

  _syncValue() {
    if (!this._input) return;
    this._input.value = this.value;
    this.setAttribute('aria-valuemin', this.min);
    this.setAttribute('aria-valuemax', this.max);
    this.setAttribute('aria-valuenow', this.value);
  }

  _step(dir) {
    if (this.hasAttribute('disabled')) return;
    const next = this.value + this.step * dir;
    this.value = Math.max(this.min, Math.min(this.max, next));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  _onInputChange = () => {
    const v = parseFloat(this._input.value);
    if (!isNaN(v)) {
      this.value = Math.max(this.min, Math.min(this.max, v));
    }
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  _onKey = (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); this._step(1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); this._step(-1); }
  };
}

customElements.define('jfx-spinner', JfxSpinner);
