const SVG_SORT = `<svg viewBox="0 0 7 4" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h7L3.5 4z" fill="var(--jfx-mark-color)"/></svg>`;

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
    overflow: auto;
    outline: none;
  }

  :host(:focus) {
    border-color: var(--jfx-focus-color);
    box-shadow: 0 0 0 1.4px var(--jfx-faint-focus-color);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  /* ── Column headers ── */
  th {
    position: sticky;
    top: 0;
    z-index: 2;
    font-weight: bold;
    height: 2em;
    color: var(--jfx-text-base-color);
    cursor: default;
    user-select: none;
    padding: 0;

    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top),
      var(--jfx-normal-body-bot));
    border-right: 1px solid var(--jfx-box-border);
    border-bottom: 1px solid var(--jfx-box-border);
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      inset 0 -1px 0 0 var(--jfx-normal-inner-bot);
  }

  th:last-child { border-right: none; }

  th:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top),
      var(--jfx-hover-body-bot));
  }

  /* Text label inside header — clips long text */
  .th-label {
    display: block;
    padding: 0.167em 0.5em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
  }

  /* ── Resize handle: sits on right edge of th ── */
  .col-resize {
    position: absolute;
    top: 0;
    right: -3px;
    width: 7px;
    height: 100%;
    cursor: col-resize;
    z-index: 4;
  }

  .sort-arrow {
    display: inline-block;
    width: 0.583em;
    height: 0.333em;
    margin-left: 0.25em;
    vertical-align: middle;
    line-height: 0;
    opacity: 0;
    transition: opacity 0.1s, transform 0.15s;
  }
  .sort-arrow svg { display: block; width: 100%; height: 100%; }

  th[aria-sort="ascending"] .sort-arrow {
    opacity: 1;
    transform: rotate(180deg);
  }
  th[aria-sort="descending"] .sort-arrow {
    opacity: 1;
  }

  /* ── Rows ── */
  td {
    padding: 0.167em 0.5em;
    height: 2em;
    color: var(--jfx-text-bg-color);
    border-right: 1px solid var(--jfx-control-inner-bg-alt);
    cursor: default;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  td:last-child { border-right: none; }

  tr { background: var(--jfx-control-inner-bg); }
  tr:nth-child(even) { background: var(--jfx-control-inner-bg-alt); }
  tr:hover { background: var(--jfx-cell-hover-color); }

  tr[aria-selected="true"] {
    background: var(--jfx-selection-bar-non-focused);
  }
  :host(:focus) tr[aria-selected="true"] {
    background: var(--jfx-accent);
  }
  :host(:focus) tr[aria-selected="true"] td {
    color: white;
    border-right-color: rgba(255,255,255,0.15);
  }

  .empty {
    text-align: center;
    padding: 2em;
    color: var(--jfx-prompt-text);
    font-size: 1.167em;
  }
</style>
<table part="table">
  <thead><tr class="header-row"></tr></thead>
  <tbody></tbody>
</table>
`;

class JfxTableView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._thead = this.shadowRoot.querySelector('.header-row');
    this._tbody = this.shadowRoot.querySelector('tbody');
    this._columns = [];
    this._data = [];
    this._selectedIndex = -1;
    this._sortCol = -1;
    this._sortDir = 0;
  }

  connectedCallback() {
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this._parseColumns();
    this._parseData();
    this._render();
    this.addEventListener('keydown', this._onKey);
  }

  _parseColumns() {
    this._columns = [];
    for (const col of this.querySelectorAll('jfx-table-column')) {
      this._columns.push({
        label: col.getAttribute('label') || '',
        field: col.getAttribute('field') || '',
        width: col.getAttribute('width') || 'auto',
      });
    }
  }

  _parseData() {
    this._data = [];
    for (const row of this.querySelectorAll('jfx-table-row')) {
      const obj = {};
      for (const col of this._columns) {
        obj[col.field] = row.getAttribute(col.field) || '';
      }
      this._data.push(obj);
    }
  }

  _render() {
    this._thead.innerHTML = '';
    this._columns.forEach((col, i) => {
      const th = document.createElement('th');
      th.style.position = 'sticky';
      if (col.width !== 'auto') th.style.width = col.width;

      const label = document.createElement('span');
      label.className = 'th-label';
      label.textContent = col.label;
      label.innerHTML += `<span class="sort-arrow">${SVG_SORT}</span>`;
      th.appendChild(label);

      th.addEventListener('click', (e) => {
        if (e.target.classList.contains('col-resize')) return;
        this._sort(i);
      });

      if (i < this._columns.length - 1) {
        const handle = document.createElement('div');
        handle.className = 'col-resize';
        handle.addEventListener('pointerdown', (e) => this._onResizeStart(e, i));
        th.appendChild(handle);
      }

      this._thead.appendChild(th);
    });

    this._renderRows();
  }

  _onResizeStart(e, colIndex) {
    e.preventDefault();
    e.stopPropagation();

    const handle = e.target;
    handle.setPointerCapture(e.pointerId);

    const headers = [...this._thead.querySelectorAll('th')];
    const th = headers[colIndex];
    const nextTh = headers[colIndex + 1];
    if (!nextTh) return;

    // Lock all widths to px
    headers.forEach(h => { h.style.width = h.offsetWidth + 'px'; });

    const startX = e.clientX;
    const startW = th.offsetWidth;
    const nextW = nextTh.offsetWidth;
    const MIN = 40;

    const onMove = (ev) => {
      let d = ev.clientX - startX;
      d = Math.max(d, MIN - startW);
      d = Math.min(d, nextW - MIN);
      th.style.width = (startW + d) + 'px';
      nextTh.style.width = (nextW - d) + 'px';
    };

    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('lostpointercapture', onUp);
    };

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('lostpointercapture', onUp);
  }

  _renderRows() {
    this._tbody.innerHTML = '';
    if (this._data.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.className = 'empty';
      td.colSpan = this._columns.length;
      td.textContent = 'Sin datos';
      tr.appendChild(td);
      this._tbody.appendChild(tr);
      return;
    }

    this._data.forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.setAttribute('aria-selected', i === this._selectedIndex ? 'true' : 'false');
      tr.addEventListener('click', () => this._select(i));
      for (const col of this._columns) {
        const td = document.createElement('td');
        td.textContent = row[col.field] || '';
        tr.appendChild(td);
      }
      this._tbody.appendChild(tr);
    });
  }

  _select(index) {
    this._selectedIndex = index;
    const rows = this._tbody.querySelectorAll('tr');
    rows.forEach((tr, i) => {
      tr.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
    if (rows[index]) rows[index].scrollIntoView({ block: 'nearest' });
    this.dispatchEvent(new CustomEvent('select', { detail: { index, row: this._data[index] }, bubbles: true }));
  }

  _sort(colIndex) {
    if (this._sortCol === colIndex) {
      this._sortDir = this._sortDir === 1 ? -1 : 1;
    } else {
      this._sortCol = colIndex;
      this._sortDir = 1;
    }
    const field = this._columns[colIndex].field;
    this._data.sort((a, b) => {
      const av = a[field], bv = b[field];
      if (av === '' && bv !== '') return 1;
      if (av !== '' && bv === '') return -1;
      const numA = Number(av), numB = Number(bv);
      const cmp = (!isNaN(numA) && !isNaN(numB) && av !== '' && bv !== '')
        ? numA - numB
        : String(av).localeCompare(String(bv));
      return cmp * this._sortDir;
    });
    this._thead.querySelectorAll('th').forEach((th, i) => {
      th.removeAttribute('aria-sort');
      if (i === colIndex) {
        th.setAttribute('aria-sort', this._sortDir === 1 ? 'ascending' : 'descending');
      }
    });
    this._selectedIndex = -1;
    this._renderRows();
    this.scrollTop = 0;
  }

  _onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = this._selectedIndex < 0 ? 0 : Math.min(this._selectedIndex + 1, this._data.length - 1);
      this._select(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = this._selectedIndex < 0 ? this._data.length - 1 : Math.max(this._selectedIndex - 1, 0);
      this._select(prev);
    }
  };
}

customElements.define('jfx-table-view', JfxTableView);
customElements.define('jfx-table-column', class extends HTMLElement {});
customElements.define('jfx-table-row', class extends HTMLElement {});
