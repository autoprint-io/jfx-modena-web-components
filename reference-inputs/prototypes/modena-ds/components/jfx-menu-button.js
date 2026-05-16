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
  }

  .trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.333em;
    box-sizing: border-box;
    cursor: default;
    user-select: none;
    font: inherit;
    color: var(--jfx-text-base-color);
    padding: 0.333em 0.667em;
    min-width: 4em;

    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top), var(--jfx-normal-body-bot));
    border: 1px solid var(--jfx-normal-outer-border);
    border-radius: 3px;
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      inset 0 -1px 0 0 var(--jfx-normal-inner-bot),
      0 1px 0 0 var(--jfx-shadow-highlight);
  }

  .trigger:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top), var(--jfx-hover-body-bot));
    border-color: var(--jfx-hover-outer-border);
  }

  :host([open]) .trigger,
  .trigger:active {
    background: linear-gradient(to bottom,
      var(--jfx-pressed-body-top), var(--jfx-pressed-body-bot));
    border-color: var(--jfx-pressed-outer-border);
  }

  :host(:focus-visible) .trigger {
    border-color: var(--jfx-focus-color);
    box-shadow: 0 0 0 1.4px var(--jfx-faint-focus-color),
      inset 0 1px 0 0 var(--jfx-normal-inner-top);
  }
  :host(:focus-visible) { outline: none; }

  .label { flex: 1; }
  .arrow { width: 0.583em; height: 0.333em; line-height: 0; margin-left: 0.5em; }
  .arrow svg { display: block; width: 100%; height: 100%; }

  .popup {
    display: none; position: absolute; top: calc(100% + 2px); left: 0;
    z-index: 9999; min-width: 100%;
    background: var(--jfx-control-inner-bg);
    border: 1px solid var(--jfx-context-border-top);
    border-radius: 6px; padding: 0.333em 0;
    box-shadow: 0 6px 12px rgba(0,0,0,0.18);
  }
  :host([open]) .popup { display: block; }

  :host([disabled]) { opacity: 0.4; pointer-events: none; }
</style>
<button class="trigger" tabindex="-1" part="trigger">
  <span class="label" part="label"><slot name="label"></slot></span>
  <span class="arrow">${SVG_ARROW}</span>
</button>
<div class="popup" part="popup" role="menu"><slot></slot></div>
`;

class JfxMenuButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this.shadowRoot.querySelector('.trigger').addEventListener('click', this._toggle);
    this.addEventListener('keydown', this._onKey);
    this._outsideClick = (e) => { if (!this.contains(e.target)) this._close(); };
    document.addEventListener('click', this._outsideClick);
  }

  disconnectedCallback() { document.removeEventListener('click', this._outsideClick); }

  _toggle = (e) => {
    e.stopPropagation();
    this.hasAttribute('open') ? this._close() : this.setAttribute('open', '');
  };
  _close() { this.removeAttribute('open'); }
  _onKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this._toggle(e); }
    else if (e.key === 'Escape') this._close();
  };
}

customElements.define('jfx-menu-button', JfxMenuButton);
