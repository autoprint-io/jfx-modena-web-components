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
  }

  .radio {
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
    border-radius: 50%;
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      inset 0 -1px 0 0 var(--jfx-normal-inner-bot),
      0 1px 0 0 var(--jfx-shadow-highlight);
  }

  .dot {
    display: block;
    width: 0.5em;
    height: 0.5em;
    border-radius: 50%;
    background: transparent;
    transition: background 0.05s;
  }

  .label {
    padding-left: 0.417em;
    color: var(--jfx-text-bg-color);
  }

  /* ── Hover ── */
  :host(:hover) .radio {
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
  :host(:active) .radio {
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
  :host(:focus-visible) .radio {
    border-color: var(--jfx-focus-color);
    box-shadow:
      0 0 0 1.4px var(--jfx-faint-focus-color),
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      inset 0 -1px 0 0 var(--jfx-normal-inner-bot);
  }
  :host(:focus-visible) {
    outline: none;
  }

  /* ── Selected ── */
  :host([checked]) .dot {
    background: var(--jfx-mark-color);
    box-shadow: 0 1px 0 0 var(--jfx-mark-highlight);
  }

  /* ── Disabled ── */
  :host([disabled]) {
    opacity: 0.4;
    pointer-events: none;
  }

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }
</style>
<input type="radio" tabindex="-1" aria-hidden="true" part="input">
<span class="radio" part="radio">
  <span class="dot"></span>
</span>
<span class="label" part="label"><slot></slot></span>
`;

class JfxRadioButton extends HTMLElement {
  static observedAttributes = ['checked', 'disabled', 'name', 'value'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._input = this.shadowRoot.querySelector('input');
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'radio');
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

  attributeChangedCallback() {
    this._syncState();
  }

  _syncState() {
    this._input.checked = this.checked;
    this.setAttribute('aria-checked', String(this.checked));
  }

  _onClick = () => {
    if (this.hasAttribute('disabled') || this.checked) return;
    this._deselectGroup();
    this.checked = true;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  _onKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this._onClick();
    }
  };

  _deselectGroup() {
    const name = this.getAttribute('name');
    if (!name) return;
    const group = (this.getRootNode() || document).querySelectorAll(`jfx-radio-button[name="${name}"]`);
    for (const radio of group) {
      if (radio !== this) radio.removeAttribute('checked');
    }
  }
}

customElements.define('jfx-radio-button', JfxRadioButton);
