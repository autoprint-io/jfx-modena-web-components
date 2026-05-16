const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: flex;
    align-items: stretch;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    padding: 0 0.667em;
    gap: 0.167em;

    /* ── Modena menubar: extremely subtle gradient ──
       Almost blends with window background. Thin dark line at bottom. */
    background: linear-gradient(to bottom,
      var(--jfx-menubar-body-top),
      var(--jfx-menubar-body-bot));
    border-top: 1px solid var(--jfx-menubar-border-top);
    border-bottom: 1px solid var(--jfx-outer-border);
  }

  ::slotted(jfx-menu) {
    display: inline-flex;
  }
</style>
<slot></slot>
`;

class JfxMenuBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.setAttribute('role', 'menubar');
  }
}

customElements.define('jfx-menu-bar', JfxMenuBar);
