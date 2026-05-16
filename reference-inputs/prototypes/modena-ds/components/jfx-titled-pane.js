const SVG_ARROW = `<svg viewBox="0 0 7 4" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h7L3.5 4z" fill="var(--jfx-mark-color)"/></svg>`;

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: block;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
  }

  /* ── Title bar: button-like with darker bottom edge ── */
  .title {
    display: flex;
    align-items: center;
    cursor: default;
    user-select: none;
    padding: 0.333em 0.75em;
    color: var(--jfx-text-base-color);

    background:
      linear-gradient(to bottom,
        var(--jfx-normal-body-top) 0%,
        var(--jfx-normal-body-bot) 95%,
        var(--jfx-titled-border-bot) 100%);
    border: 1px solid var(--jfx-normal-outer-border);
    border-radius: 3px 3px 0 0;
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top);
  }

  .title:hover {
    background:
      linear-gradient(to bottom,
        var(--jfx-hover-body-top) 0%,
        var(--jfx-hover-body-bot) 95%,
        var(--jfx-titled-border-bot) 100%);
    border-color: var(--jfx-hover-outer-border);
  }

  /* ── Arrow ── */
  .arrow {
    width: 0.583em;
    height: 0.333em;
    margin-right: 0.583em;
    line-height: 0;
    transition: transform 0.15s ease;
    transform: rotate(-90deg);
  }
  :host([expanded]) .arrow {
    transform: rotate(0deg);
  }
  .arrow svg { display: block; width: 100%; height: 100%; }

  :host(:focus-visible) .arrow svg path {
    filter: drop-shadow(0 0 3px var(--jfx-focus-color));
  }
  :host(:focus-visible) { outline: none; }

  .label { flex: 1; }

  /* ── Content ── */
  .content {
    display: none;
    border: 1px solid var(--jfx-box-border);
    border-top: none;
    background: linear-gradient(to bottom,
      var(--jfx-content-shadow) 0px,
      var(--jfx-background) 5px);
    padding: 0.667em;
  }

  :host([expanded]) .content {
    display: block;
  }

  /* ── Collapsed: rounded bottom ── */
  :host(:not([expanded])) .title {
    border-radius: 3px;
  }

  :host([disabled]) {
    opacity: 0.4;
    pointer-events: none;
  }
</style>
<div class="title" part="title" role="button" aria-expanded="false">
  <span class="arrow">${SVG_ARROW}</span>
  <span class="label" part="label"><slot name="title"></slot></span>
</div>
<div class="content" part="content" role="region">
  <slot></slot>
</div>
`;

class JfxTitledPane extends HTMLElement {
  static observedAttributes = ['expanded', 'disabled'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._title = this.shadowRoot.querySelector('.title');
  }

  connectedCallback() {
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this._title.addEventListener('click', this._toggle);
    this.addEventListener('keydown', this._onKey);
    this._sync();
  }

  disconnectedCallback() {
    this._title.removeEventListener('click', this._toggle);
    this.removeEventListener('keydown', this._onKey);
  }

  get expanded() { return this.hasAttribute('expanded'); }
  set expanded(v) { v ? this.setAttribute('expanded', '') : this.removeAttribute('expanded'); }

  attributeChangedCallback() { this._sync(); }

  _sync() {
    this._title?.setAttribute('aria-expanded', String(this.expanded));
  }

  _toggle = () => {
    if (this.hasAttribute('disabled')) return;
    this.expanded = !this.expanded;
    this.dispatchEvent(new Event('toggle', { bubbles: true }));
  };

  _onKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this._toggle(); }
  };
}

customElements.define('jfx-titled-pane', JfxTitledPane);
