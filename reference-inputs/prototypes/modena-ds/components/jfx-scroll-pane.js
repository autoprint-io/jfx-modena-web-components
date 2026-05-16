const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: block;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    overflow: hidden;
    border: 1px solid var(--jfx-box-border);
    border-radius: 2px;
    background: var(--jfx-background);
  }

  :host(:focus-within) {
    border-color: var(--jfx-focus-color);
    box-shadow:
      0 0 0 1.4px var(--jfx-faint-focus-color);
    outline: none;
  }

  .viewport {
    overflow: auto;
    width: 100%;
    height: 100%;
    background: var(--jfx-background);
    scrollbar-width: thin;
    scrollbar-color: var(--jfx-normal-outer-border) transparent;
  }

  .viewport::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
  .viewport::-webkit-scrollbar-track {
    background: linear-gradient(to bottom,
      var(--jfx-scrollbar-bg-1),
      var(--jfx-scrollbar-bg-2) 50%,
      var(--jfx-scrollbar-bg-1));
  }
  .viewport::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top),
      var(--jfx-normal-body-bot));
    border: 1px solid var(--jfx-normal-outer-border);
    border-radius: 3px;
    min-height: 20px;
  }
  .viewport::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top),
      var(--jfx-hover-body-bot));
  }
</style>
<div class="viewport" part="viewport" tabindex="0">
  <slot></slot>
</div>
`;

class JfxScrollPane extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('jfx-scroll-pane', JfxScrollPane);
