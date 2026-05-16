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
    min-width: 8em;
  }

  .wrapper {
    display: flex;
    width: 100%;
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

  .wrapper:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top),
      var(--jfx-hover-body-bot));
    border-color: var(--jfx-hover-outer-border);
  }

  :host([open]) .wrapper {
    background: linear-gradient(to bottom,
      var(--jfx-pressed-body-top),
      var(--jfx-pressed-body-bot));
    border-color: var(--jfx-pressed-outer-border);
  }

  /* ── Editable mode: text input on left ── */
  input {
    all: unset;
    flex: 1;
    min-width: 0;
    font: inherit;
    color: var(--jfx-text-base-color);
    padding: 0.333em 0.667em;
    cursor: text;
  }

  :host(:not([editable])) input {
    cursor: default;
    pointer-events: none;
  }

  /* ── Arrow button (right) ── */
  .arrow-btn {
    all: unset;
    display: flex;
    align-items: center;
    padding: 0.5em 0.667em 0.5em 0.833em;
    cursor: default;
    border-left: none;
    border-radius: 0 3px 3px 0;
  }

  .arrow-btn:hover {
    background: rgba(0,0,0,0.03);
  }

  .arrow {
    width: 0.583em;
    height: 0.333em;
    line-height: 0;
  }
  .arrow svg { display: block; width: 100%; height: 100%; }

  /* ── Focus ── */
  :host(:focus-within) .wrapper {
    border-color: var(--jfx-focus-color);
    box-shadow:
      0 0 0 1.4px var(--jfx-faint-focus-color),
      inset 0 1px 0 0 var(--jfx-normal-inner-top);
  }

  /* ── Popup ── */
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
  :host([open]) .popup { display: block; }

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
<div class="wrapper" part="wrapper">
  <input part="input" type="text" readonly>
  <button class="arrow-btn" tabindex="-1" part="arrow">
    <span class="arrow">${SVG_ARROW}</span>
  </button>
</div>
<div class="popup" part="popup" role="listbox"></div>
`;

class JfxComboBox extends HTMLElement {
  static observedAttributes = ['value', 'editable', 'disabled'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._input = this.shadowRoot.querySelector('input');
    this._popup = this.shadowRoot.querySelector('.popup');
    this._arrowBtn = this.shadowRoot.querySelector('.arrow-btn');
    this._options = [];
  }

  connectedCallback() {
    this.setAttribute('role', 'combobox');
    this._parseOptions();
    this._arrowBtn.addEventListener('click', this._toggle);
    this._input.addEventListener('keydown', this._onKey);
    if (this.hasAttribute('editable')) {
      this._input.removeAttribute('readonly');
      this._input.addEventListener('input', this._onType);
    }
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
    if (name === 'editable') {
      this.hasAttribute('editable') ? this._input.removeAttribute('readonly') : this._input.setAttribute('readonly', '');
    }
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
  }

  _syncLabel() {
    const opt = this._options.find(o => o.val === this.value);
    this._input.value = opt ? opt.label : this.value;
    for (const el of this._popup.querySelectorAll('.option')) {
      el.setAttribute('aria-selected', el.dataset.value === this.value ? 'true' : 'false');
    }
  }

  _select(val) {
    this.value = val;
    this._close();
    this.dispatchEvent(new Event('change', { bubbles: true }));
    this._input.focus();
  }

  _toggle = (e) => {
    e.stopPropagation();
    this.hasAttribute('open') ? this._close() : this.setAttribute('open', '');
  };

  _close() { this.removeAttribute('open'); }

  _onType = () => {
    this.setAttribute('open', '');
    const q = this._input.value.toLowerCase();
    for (const el of this._popup.querySelectorAll('.option')) {
      el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
    }
  };

  _onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this.hasAttribute('open')) { this.setAttribute('open', ''); return; }
      const idx = this._options.findIndex(o => o.val === this.value);
      if (idx < this._options.length - 1) this._select(this._options[idx + 1].val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = this._options.findIndex(o => o.val === this.value);
      if (idx > 0) this._select(this._options[idx - 1].val);
    } else if (e.key === 'Enter') {
      this._close();
    } else if (e.key === 'Escape') {
      this._close();
    }
  };
}

customElements.define('jfx-combo-box', JfxComboBox);
