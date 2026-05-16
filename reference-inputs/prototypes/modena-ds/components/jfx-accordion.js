const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: block;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
  }

  ::slotted(jfx-titled-pane) {
    border-radius: 0 !important;
  }
  ::slotted(jfx-titled-pane:first-child) {
    border-radius: 3px 3px 0 0 !important;
  }
  ::slotted(jfx-titled-pane:last-child) {
    border-radius: 0 0 3px 3px !important;
  }
  ::slotted(jfx-titled-pane + jfx-titled-pane) {
    margin-top: -1px;
  }
</style>
<slot></slot>
`;

class JfxAccordion extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.addEventListener('toggle', this._onToggle);
  }

  disconnectedCallback() {
    this.removeEventListener('toggle', this._onToggle);
  }

  _onToggle = (e) => {
    const source = e.target;
    if (!source.expanded) return;
    for (const pane of this.querySelectorAll('jfx-titled-pane')) {
      if (pane !== source) pane.removeAttribute('expanded');
    }
  };
}

customElements.define('jfx-accordion', JfxAccordion);
