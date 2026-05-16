const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: block;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    border: 1px solid var(--jfx-box-border);
    border-radius: 2px;
    background: var(--jfx-control-inner-bg);
    overflow-y: auto;
    max-height: 12em;
    outline: none;
  }

  :host(:focus) {
    border-color: var(--jfx-focus-color);
    box-shadow: 0 0 0 1.4px var(--jfx-faint-focus-color);
  }

  .cell {
    padding: 0.25em 0.583em;
    cursor: default;
    color: var(--jfx-text-bg-color);
    user-select: none;
  }

  .cell:nth-child(odd) {
    background: var(--jfx-control-inner-bg-alt);
  }

  .cell:hover {
    background: var(--jfx-cell-hover-color);
  }

  .cell[aria-selected="true"] {
    background: var(--jfx-selection-bar-non-focused);
    color: var(--jfx-text-bg-color);
  }

  :host(:focus) .cell[aria-selected="true"] {
    background: var(--jfx-accent);
    color: white;
  }
</style>
<div role="listbox" part="list"></div>
`;

class JfxListView extends HTMLElement {
  static observedAttributes = ['value'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._list = this.shadowRoot.querySelector('[role="listbox"]');
  }

  connectedCallback() {
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this._buildItems();
    this.addEventListener('keydown', this._onKey);
  }

  get value() { return this.getAttribute('value') || ''; }
  set value(v) { this.setAttribute('value', v); this._syncSelection(); }

  attributeChangedCallback(name) {
    if (name === 'value') this._syncSelection();
  }

  _buildItems() {
    this._list.innerHTML = '';
    for (const el of this.querySelectorAll('option')) {
      const val = el.value || el.textContent.trim();
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.setAttribute('role', 'option');
      cell.dataset.value = val;
      cell.textContent = el.textContent.trim();
      cell.addEventListener('click', () => {
        this.value = val;
        this.dispatchEvent(new Event('change', { bubbles: true }));
      });
      this._list.appendChild(cell);
    }
    if (!this.value) {
      const first = this.querySelector('option');
      if (first) this.value = first.value || first.textContent.trim();
    }
    this._syncSelection();
  }

  _syncSelection() {
    for (const cell of this._list.querySelectorAll('.cell')) {
      cell.setAttribute('aria-selected', cell.dataset.value === this.value ? 'true' : 'false');
    }
  }

  _onKey = (e) => {
    const cells = [...this._list.querySelectorAll('.cell')];
    const idx = cells.findIndex(c => c.dataset.value === this.value);
    if (e.key === 'ArrowDown' && idx < cells.length - 1) {
      e.preventDefault();
      this.value = cells[idx + 1].dataset.value;
      this.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (e.key === 'ArrowUp' && idx > 0) {
      e.preventDefault();
      this.value = cells[idx - 1].dataset.value;
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };
}

customElements.define('jfx-list-view', JfxListView);
