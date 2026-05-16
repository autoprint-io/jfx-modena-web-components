const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline-flex;
    position: relative;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
  }

  .trigger {
    all: unset;
    display: flex;
    align-items: center;
    padding: 0.333em 0.667em;
    cursor: default;
    user-select: none;
    color: var(--jfx-text-base-color);
    background: transparent;
  }

  .trigger:hover {
    background: var(--jfx-accent);
    color: white;
  }

  :host([open]) .trigger {
    background: var(--jfx-accent);
    color: white;
  }

  .popup {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 9999;
    min-width: 12em;
    background: var(--jfx-control-inner-bg);
    border: 1px solid var(--jfx-context-border-top);
    border-radius: 6px;
    padding: 0.333em 0;
    box-shadow: 0 6px 12px rgba(0,0,0,0.18);
  }

  :host([open]) .popup {
    display: block;
  }
</style>
<button class="trigger" tabindex="-1" part="trigger"><slot name="label"></slot></button>
<div class="popup" part="popup" role="menu">
  <slot></slot>
</div>
`;

class JfxMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._trigger = this.shadowRoot.querySelector('.trigger');
  }

  connectedCallback() {
    this.setAttribute('role', 'menuitem');
    this._trigger.addEventListener('click', this._toggle);
    this._trigger.addEventListener('mouseenter', this._onHover);
    this._outsideClick = (e) => { if (!this.contains(e.target)) this._close(); };
    document.addEventListener('click', this._outsideClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._outsideClick);
  }

  _toggle = (e) => {
    e.stopPropagation();
    if (this.hasAttribute('open')) {
      this._close();
    } else {
      this._closeSiblings();
      this.setAttribute('open', '');
    }
  };

  _onHover = () => {
    const bar = this.closest('jfx-menu-bar');
    if (!bar) return;
    const anyOpen = bar.querySelector('jfx-menu[open]');
    if (anyOpen && anyOpen !== this) {
      anyOpen.removeAttribute('open');
      this.setAttribute('open', '');
    }
  };

  _closeSiblings() {
    const bar = this.closest('jfx-menu-bar');
    if (!bar) return;
    for (const menu of bar.querySelectorAll('jfx-menu[open]')) {
      if (menu !== this) menu.removeAttribute('open');
    }
  }

  _close() {
    this.removeAttribute('open');
  }
}

customElements.define('jfx-menu', JfxMenu);
