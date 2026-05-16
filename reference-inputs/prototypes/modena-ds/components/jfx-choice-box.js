const SVG_ARROW = `<svg viewBox="0 0 7 4" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h7L3.5 4z" fill="var(--jfx-mark-color)"/></svg>`;

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline-flex;
    vertical-align: middle;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    position: relative;
    user-select: none;
    cursor: default;
  }

  .button {
    display: flex;
    align-items: center;
    gap: 0.333em;
    box-sizing: border-box;
    min-width: 5em;

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

  .label {
    flex: 1;
    padding: 0.333em 0.667em;
    color: var(--jfx-text-base-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .arrow-box {
    display: flex;
    align-items: center;
    padding: 0.5em 0.667em 0.5em 0;
  }

  .arrow {
    width: 0.583em;
    height: 0.333em;
    line-height: 0;
  }
  .arrow svg { display: block; width: 100%; height: 100%; }

  /* ── Hover ── */
  .button:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top),
      var(--jfx-hover-body-bot));
    border-color: var(--jfx-hover-outer-border);
  }

  /* ── Active / Showing ── */
  :host([open]) .button,
  .button:active {
    background: linear-gradient(to bottom,
      var(--jfx-pressed-body-top),
      var(--jfx-pressed-body-bot));
    border-color: var(--jfx-pressed-outer-border);
  }

  /* ── Focus ── */
  :host(:focus-visible) .button {
    border-color: var(--jfx-focus-color);
    box-shadow:
      0 0 0 1.4px var(--jfx-faint-focus-color),
      inset 0 1px 0 0 var(--jfx-normal-inner-top);
  }
  :host(:focus-visible) { outline: none; }

  /* ── Dropdown popup ── */
  .popup {
    display: none;
    position: absolute;
    top: calc(100% + 2px);
    left: 0;
    min-width: 100%;
    z-index: 9999;
    background: white;
    border: 1px solid var(--jfx-outer-border);
    border-radius: 6px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.15);
    padding: 0.25em 0;
    max-height: 15em;
    overflow-y: auto;
  }

  :host([open]) .popup {
    display: block;
  }

  .option {
    padding: 0.333em 0.75em;
    cursor: default;
    color: var(--jfx-text-bg-color);
    white-space: nowrap;
  }
  .option:hover {
    background: var(--jfx-cell-hover-color);
  }
  .option[aria-selected="true"] {
    background: var(--jfx-accent);
    color: white;
  }

  :host([disabled]) {
    opacity: 0.4;
    pointer-events: none;
  }
</style>
<div class="button" part="button">
  <span class="label" part="label"></span>
  <span class="arrow-box"><span class="arrow">${SVG_ARROW}</span></span>
</div>
<div class="popup" part="popup" role="listbox"></div>
`;

class JfxChoiceBox extends HTMLElement {
  static observedAttributes = ['value', 'disabled'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._label = this.shadowRoot.querySelector('.label');
    this._popup = this.shadowRoot.querySelector('.popup');
    this._button = this.shadowRoot.querySelector('.button');
    this._options = [];
  }

  connectedCallback() {
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this.setAttribute('role', 'combobox');
    this._parseOptions();
    this._button.addEventListener('click', this._toggle);
    this.addEventListener('keydown', this._onKey);
    this._outsideClick = (e) => { if (!this.contains(e.target)) this._close(); };
    document.addEventListener('click', this._outsideClick);
    this._syncLabel();
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._outsideClick);
  }

  get value() { return this.getAttribute('value') || ''; }
  set value(v) { this.setAttribute('value', v); }

  attributeChangedCallback(name) {
    if (name === 'value') this._syncLabel();
  }

  _parseOptions() {
    this._options = [];
    this._popup.innerHTML = '';
    for (const el of this.querySelectorAll('option')) {
      const val = el.value || el.textContent.trim();
      const label = el.textContent.trim();
      this._options.push({ val, label });
      const div = document.createElement('div');
      div.className = 'option';
      div.setAttribute('role', 'option');
      div.textContent = label;
      div.dataset.value = val;
      div.addEventListener('click', () => this._select(val));
      this._popup.appendChild(div);
    }
    if (!this.value && this._options.length) {
      this.value = this._options[0].val;
    }
    this._syncLabel();
  }

  _syncLabel() {
    const opt = this._options.find(o => o.val === this.value);
    this._label.textContent = opt ? opt.label : this.value;
    for (const el of this._popup.querySelectorAll('.option')) {
      el.setAttribute('aria-selected', el.dataset.value === this.value ? 'true' : 'false');
    }
  }

  _select(val) {
    this.value = val;
    this._close();
    this.dispatchEvent(new Event('change', { bubbles: true }));
    this.focus();
  }

  _toggle = (e) => {
    e.stopPropagation();
    this.hasAttribute('open') ? this._close() : this.setAttribute('open', '');
  };

  _close() { this.removeAttribute('open'); }

  _onKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this._toggle(e);
    } else if (e.key === 'Escape') {
      this._close();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = this._options.findIndex(o => o.val === this.value);
      const next = e.key === 'ArrowDown' ? Math.min(idx + 1, this._options.length - 1) : Math.max(idx - 1, 0);
      this._select(this._options[next].val);
    }
  };
}

customElements.define('jfx-choice-box', JfxChoiceBox);
