// Based on certified phase-26-v2 + JavaFX reference screenshots
// Calendar icon: CSS gradients (no SVG), matching Modena's grid-lines icon
const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline-block;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    line-height: normal;
  }

  .root { position: relative; display: inline-block; }

  /* ── ComboBox-base layout: text-field + arrow-button ── */
  .picker {
    display: inline-grid;
    grid-template-columns: 1fr 32px;
    align-items: stretch;
    width: 170px;
    height: 27px;
    box-sizing: border-box;
    border-radius: 3px;
    cursor: default;
    outline: none;
  }

  /* ── Text field (left) ── */
  .text-field {
    min-width: 0;
    box-sizing: border-box;
    border: 1px solid var(--jfx-text-box-border);
    border-right: 0;
    border-radius: 3px 0 0 3px;
    background: linear-gradient(to bottom,
      var(--jfx-control-inner-shadow) 0px,
      var(--jfx-control-inner-bg) 5px);
    color: var(--jfx-text-inner-color);
    font: inherit;
    padding: 3px 7px;
    outline: none;
  }

  /* ── Arrow button with calendar icon ── */
  .arrow-button {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--jfx-normal-outer-border);
    border-radius: 0 3px 3px 0;
    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top),
      var(--jfx-normal-body-bot));
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      inset 0 -1px 0 0 var(--jfx-normal-inner-bot);
  }

  .arrow-button:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top),
      var(--jfx-hover-body-bot));
  }

  /* Calendar grid icon via CSS gradients */
  .calendar-icon {
    width: 13px;
    height: 13px;
    color: var(--jfx-mark-color);
    background:
      linear-gradient(currentColor 0 0) 0 0 / 100% 2px no-repeat,
      linear-gradient(currentColor 0 0) 0 4px / 100% 1px no-repeat,
      linear-gradient(currentColor 0 0) 0 8px / 100% 1px no-repeat,
      linear-gradient(currentColor 0 0) 0 12px / 100% 1px no-repeat,
      linear-gradient(currentColor 0 0) 0 0 / 2px 100% no-repeat,
      linear-gradient(currentColor 0 0) 4px 0 / 1px 100% no-repeat,
      linear-gradient(currentColor 0 0) 8px 0 / 1px 100% no-repeat,
      linear-gradient(currentColor 0 0) 12px 0 / 1px 100% no-repeat;
  }

  /* ── Focus ── */
  :host(:focus-within) .picker {
    box-shadow: 0 0 0 1px var(--jfx-focus-color), 0 0 0 3px var(--jfx-faint-focus-color);
  }
  :host(:focus-within) .text-field {
    border-color: var(--jfx-focus-color);
  }

  /* ── Popup ── */
  .popup {
    display: none;
    position: absolute;
    left: 0;
    top: calc(100% + 2px);
    z-index: 9999;
    width: 252px;
    box-sizing: border-box;
    background: var(--jfx-control-inner-bg);
    border: 1px solid var(--jfx-outer-border);
    box-shadow: 0 8px 12px rgba(0,0,0,0.2);
    line-height: normal;
  }

  :host([open]) .popup { display: block; }

  /* ── Month/year navigation ── */
  .month-nav-bar {
    display: grid;
    grid-template-columns: 28px 1fr 28px;
    align-items: center;
    min-height: 34px;
    padding: 7px 6px 8px;
    background: linear-gradient(to bottom, #f1f1f1, #e2e2e2 50%, #f1f1f1);
    border-bottom: 1px solid #d0d0d0;
  }

  .month-label {
    text-align: center;
    font-weight: 600;
    font-size: 0.92em;
  }

  .nav-btn {
    all: unset;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: 1px solid var(--jfx-normal-outer-border);
    border-radius: 2px;
    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top),
      var(--jfx-normal-body-bot));
    cursor: default;
  }
  .nav-btn:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top),
      var(--jfx-hover-body-bot));
  }

  .nav-arrow-left {
    width: 0; height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 6px solid var(--jfx-mark-color);
  }
  .nav-arrow-right {
    width: 0; height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 6px solid var(--jfx-mark-color);
  }

  /* ── Calendar grid ── */
  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: #cfe7f2;
  }

  .cal-cell {
    all: unset;
    box-sizing: border-box;
    min-height: 28px;
    padding: 4px 7px;
    border: 1px solid #cfe7f2;
    background: var(--jfx-control-inner-bg);
    text-align: center;
    color: var(--jfx-text-bg-color);
    cursor: default;
    font-size: 0.92em;
  }

  .cal-cell.day-name {
    min-height: 24px;
    font-size: 0.85em;
    background: #f7f7f7;
    font-weight: 600;
  }

  .cal-cell.other-month {
    background: #f4f4f4;
    color: #777;
  }

  .cal-cell.today {
    box-shadow: inset 0 0 0 2px #b8dcea;
  }

  .cal-cell.selected {
    background: var(--jfx-accent);
    color: white;
  }

  .cal-cell:hover:not(.day-name) {
    background: var(--jfx-cell-hover-color);
  }
  .cal-cell.selected:hover {
    background: var(--jfx-accent);
  }

  :host([disabled]) {
    opacity: 0.4;
    pointer-events: none;
  }
</style>
<span class="root" part="root">
  <span class="picker" part="picker">
    <input class="text-field" part="text-field" type="text" placeholder="dd/mm/aaaa">
    <span class="arrow-button" part="arrow-button">
      <span class="calendar-icon"></span>
    </span>
  </span>
  <div class="popup" part="popup" role="dialog">
    <div class="month-nav-bar">
      <button class="nav-btn prev-btn" tabindex="-1" aria-label="Mes anterior"><span class="nav-arrow-left"></span></button>
      <span class="month-label"></span>
      <button class="nav-btn next-btn" tabindex="-1" aria-label="Mes siguiente"><span class="nav-arrow-right"></span></button>
    </div>
    <div class="cal-grid" role="grid"></div>
  </div>
</span>
`;

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

class JfxDatePicker extends HTMLElement {
  static observedAttributes = ['value', 'disabled', 'open'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._input = this.shadowRoot.querySelector('.text-field');
    this._grid = this.shadowRoot.querySelector('.cal-grid');
    this._monthLabel = this.shadowRoot.querySelector('.month-label');
    this._arrowBtn = this.shadowRoot.querySelector('.arrow-button');
    this._prevBtn = this.shadowRoot.querySelector('.prev-btn');
    this._nextBtn = this.shadowRoot.querySelector('.next-btn');
    this._viewDate = new Date();
  }

  connectedCallback() {
    this._arrowBtn.addEventListener('click', this._toggle);
    this._prevBtn.addEventListener('click', () => this._changeMonth(-1));
    this._nextBtn.addEventListener('click', () => this._changeMonth(1));
    this._input.addEventListener('change', this._onInputChange);
    this._outsideClick = (e) => { if (this.open && !this.contains(e.target)) this.open = false; };
    document.addEventListener('click', this._outsideClick);
    this._syncValue();
    this._renderCalendar();
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._outsideClick);
  }

  get open() { return this.hasAttribute('open'); }
  set open(v) {
    v ? this.setAttribute('open', '') : this.removeAttribute('open');
    if (v) this._renderCalendar();
  }

  get value() { return this.getAttribute('value') || ''; }
  set value(v) {
    this.setAttribute('value', v);
    this._syncValue();
  }

  attributeChangedCallback(name) {
    if (name === 'value') this._syncValue();
    if (name === 'open' && this.hasAttribute('open')) {
      if (this.value) {
        const d = new Date(this.value + 'T00:00:00');
        if (!isNaN(d)) this._viewDate = new Date(d);
      }
      this._renderCalendar();
    }
  }

  _syncValue() {
    if (!this._input) return;
    const v = this.value;
    if (v) {
      const d = new Date(v + 'T00:00:00');
      if (!isNaN(d)) {
        this._input.value = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        this._viewDate = new Date(d);
        return;
      }
    }
    this._input.value = '';
  }

  _toggle = (e) => {
    e.stopPropagation();
    if (this.hasAttribute('disabled')) return;
    this.open = !this.open;
  };

  _changeMonth(delta) {
    this._viewDate.setMonth(this._viewDate.getMonth() + delta);
    this._renderCalendar();
  }

  _renderCalendar() {
    const year = this._viewDate.getFullYear();
    const month = this._viewDate.getMonth();
    this._monthLabel.textContent = `${MONTHS_ES[month]} ${year}`;

    this._grid.innerHTML = '';
    for (const day of DAYS_ES) {
      const cell = document.createElement('span');
      cell.className = 'cal-cell day-name';
      cell.textContent = day;
      this._grid.appendChild(cell);
    }

    const firstDay = new Date(year, month, 1);
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const today = new Date();
    const selectedStr = this.value;

    for (let i = 0; i < 42; i++) {
      let day, dateStr, classes = ['cal-cell'];
      if (i < startDow) {
        day = daysInPrev - startDow + i + 1;
        const pm = month === 0 ? 12 : month;
        const py = month === 0 ? year - 1 : year;
        dateStr = `${py}-${String(pm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        classes.push('other-month');
      } else if (i >= startDow + daysInMonth) {
        day = i - startDow - daysInMonth + 1;
        const nm = month + 2 > 12 ? 1 : month + 2;
        const ny = month + 2 > 12 ? year + 1 : year;
        dateStr = `${ny}-${String(nm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        classes.push('other-month');
      } else {
        day = i - startDow + 1;
        dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
          classes.push('today');
        }
      }
      if (dateStr === selectedStr) classes.push('selected');

      const btn = document.createElement('button');
      btn.className = classes.join(' ');
      btn.type = 'button';
      btn.textContent = day;
      btn.tabIndex = -1;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.value = dateStr;
        this.open = false;
        this.dispatchEvent(new Event('change', { bubbles: true }));
      });
      this._grid.appendChild(btn);
    }
  }

  _onInputChange = () => {
    const parts = this._input.value.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts.map(Number);
      const date = new Date(y, m - 1, d);
      if (!isNaN(date)) {
        this.value = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };
}

customElements.define('jfx-date-picker', JfxDatePicker);
