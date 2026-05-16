const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline-flex;
    align-items: center;
    gap: 0.333em;
    vertical-align: middle;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    color: var(--jfx-text-bg-color);
    user-select: none;
    cursor: default;
  }

  :host([disabled]) {
    opacity: 0.4;
    pointer-events: none;
  }

  ::slotted(svg),
  ::slotted(img) {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
  }
</style>
<slot></slot>
`;

class JfxLabel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('jfx-label', JfxLabel);
