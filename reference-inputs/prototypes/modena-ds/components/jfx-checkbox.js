const SVG_CHECK = `<svg viewBox="-1 -2 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M-0.25,6.083c0.843-0.758,4.583,4.833,5.75,4.833S14.5-1.5,15.917-0.917c1.292,0.532-8.75,17.083-10.5,17.083C3,16.167-1.083,6.833-0.25,6.083z"
    fill="var(--mark-color)"/>
</svg>`;

const SVG_INDETERMINATE = `<svg viewBox="0 0 10 2" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="10" height="2" fill="var(--mark-color)"/>
</svg>`;

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    cursor: default;
    user-select: none;
    --mark-color: transparent;
  }

  .box {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 1.167em;
    height: 1.167em;

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

  .mark {
    display: block;
    width: 0.75em;
    height: 0.75em;
    line-height: 0;
  }
  .mark svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .label {
    padding-left: 0.417em;
    color: var(--jfx-text-bg-color);
  }

  /* ── Hover ── */
  :host(:hover) .box {
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
  :host(:active) .box {
    background: linear-gradient(to bottom,
      var(--jfx-pressed-body-top),
      var(--jfx-pressed-body-bot));
    border-color: var(--jfx-pressed-outer-border);
    box-shadow:
      inset 0 1px 0 0 var(--jfx-pressed-inner-top),
      inset 0 -1px 0 0 var(--jfx-pressed-inner-bot),
      0 1px 0 0 var(--jfx-shadow-highlight);
  }

  /* ── Focus ── */
  :host(:focus-visible) .box {
    border-color: var(--jfx-focus-color);
    box-shadow:
      0 0 0 1.4px var(--jfx-faint-focus-color),
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      inset 0 -1px 0 0 var(--jfx-normal-inner-bot);
  }

  /* ── Checked / Indeterminate ── */
  :host([checked]) {
    --mark-color: var(--jfx-mark-color);
  }
  :host([indeterminate]) {
    --mark-color: var(--jfx-mark-color);
  }

  /* ── Disabled ── */
  :host([disabled]) {
    opacity: 0.4;
    pointer-events: none;
  }

  /* Hidden native input for form participation */
  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }
</style>
<input type="checkbox" tabindex="-1" aria-hidden="true" part="input">
<span class="box" part="box">
  <span class="mark">${SVG_CHECK}</span>
</span>
<span class="label" part="label"><slot></slot></span>
`;

class JfxCheckbox extends HTMLElement {
  static observedAttributes = ['checked', 'indeterminate', 'disabled'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._mark = this.shadowRoot.querySelector('.mark');
    this._input = this.shadowRoot.querySelector('input');
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'checkbox');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKey);
    this._syncState();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onKey);
  }

  get checked() { return this.hasAttribute('checked'); }
  set checked(v) { v ? this.setAttribute('checked', '') : this.removeAttribute('checked'); }

  get indeterminate() { return this.hasAttribute('indeterminate'); }
  set indeterminate(v) { v ? this.setAttribute('indeterminate', '') : this.removeAttribute('indeterminate'); }

  attributeChangedCallback() {
    this._syncState();
  }

  _syncState() {
    const indeterminate = this.indeterminate;
    const checked = this.checked;
    this._mark.innerHTML = indeterminate ? SVG_INDETERMINATE : SVG_CHECK;
    this._input.checked = checked;
    this._input.indeterminate = indeterminate;
    this.setAttribute('aria-checked', indeterminate ? 'mixed' : String(checked));
  }

  _onClick = () => {
    if (this.hasAttribute('disabled')) return;
    if (this.indeterminate) {
      this.removeAttribute('indeterminate');
      this.setAttribute('checked', '');
    } else {
      this.checked = !this.checked;
    }
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  _onKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this._onClick();
    }
  };
}

customElements.define('jfx-checkbox', JfxCheckbox);
