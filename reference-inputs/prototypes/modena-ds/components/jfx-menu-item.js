const SVG_CHECK = `<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><path d="M0,5H2L4,8L8,0H10L5,10H3Z" fill="currentColor"/></svg>`;

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: flex;
    align-items: center;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    padding: 0.333em 0.75em 0.333em 0.418em;
    cursor: default;
    user-select: none;
    color: var(--jfx-text-base-color);
    background: transparent;
    white-space: nowrap;
    border-radius: 0;
  }

  :host(:hover),
  :host(:focus) {
    background: var(--jfx-accent);
    color: white;
    outline: none;
  }

  :host([disabled]) {
    opacity: 0.4;
    pointer-events: none;
  }

  /* ── Separator variant ── */
  :host([separator]) {
    padding: 0.25em 0;
    pointer-events: none;
    background: transparent;
  }
  :host([separator])::after {
    content: '';
    display: block;
    width: 100%;
    border-top: 1px solid var(--jfx-box-border);
  }
  :host([separator]) .left-container,
  :host([separator]) .label,
  :host([separator]) .right-container {
    display: none;
  }

  .left-container {
    width: 1.5em;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .check-icon {
    width: 0.833em;
    height: 0.833em;
    display: none;
  }
  .check-icon svg { width: 100%; height: 100%; display: block; }

  :host([checked]) .check-icon {
    display: block;
  }

  .label {
    flex: 1;
    padding: 0 0.5em 0 0;
  }

  .right-container {
    font-size: 0.85em;
    opacity: 0.7;
    padding-left: 2em;
  }
</style>
<span class="left-container" part="left">
  <span class="check-icon">${SVG_CHECK}</span>
</span>
<span class="label" part="label"><slot></slot></span>
<span class="right-container" part="shortcut"><slot name="shortcut"></slot></span>
`;

class JfxMenuItem extends HTMLElement {
  static observedAttributes = ['checked', 'disabled'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    if (!this.hasAttribute('separator')) {
      this.setAttribute('role', 'menuitem');
      this.addEventListener('click', this._onClick);
    }
  }

  _onClick = () => {
    if (this.hasAttribute('disabled') || this.hasAttribute('separator')) return;
    if (this.hasAttribute('checkable')) {
      this.toggleAttribute('checked');
    }
    this.dispatchEvent(new Event('action', { bubbles: true }));
    const menu = this.closest('jfx-menu');
    if (menu) menu.removeAttribute('open');
  };
}

customElements.define('jfx-menu-item', JfxMenuItem);
