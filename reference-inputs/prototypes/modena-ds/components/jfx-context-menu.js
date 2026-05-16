const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: none;
    position: fixed;
    z-index: 10001;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    min-width: 10em;

    background: var(--jfx-control-inner-bg);
    border: 1px solid var(--jfx-context-border-top);
    border-radius: 6px;
    padding: 0.333em 0;
    box-shadow: 0 6px 12px rgba(0,0,0,0.18);
  }

  :host([open]) {
    display: block;
  }
</style>
<slot></slot>
`;

class JfxContextMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.setAttribute('role', 'menu');
    this._outsideClick = (e) => {
      if (!this.contains(e.target)) this.close();
    };

    const target = this.getAttribute('for');
    if (target) {
      const el = document.getElementById(target);
      if (el) {
        el.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.show(e.clientX, e.clientY);
        });
      }
    }
  }

  show(x, y) {
    this.style.left = x + 'px';
    this.style.top = y + 'px';
    this.setAttribute('open', '');
    setTimeout(() => document.addEventListener('click', this._outsideClick), 0);
  }

  close() {
    this.removeAttribute('open');
    document.removeEventListener('click', this._outsideClick);
  }
}

customElements.define('jfx-context-menu', JfxContextMenu);
