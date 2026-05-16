const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: block;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
  }

  /* ── Horizontal (default) ── */
  .line {
    border: none;
    border-top: 1px solid var(--jfx-text-box-border);
    border-bottom: 1px solid var(--jfx-shadow-highlight);
    margin: 0;
  }

  /* ── Vertical ── */
  :host([orientation="vertical"]) {
    display: inline-block;
    align-self: stretch;
    min-height: 1em;
  }
  :host([orientation="vertical"]) .line {
    border-top: none;
    border-bottom: none;
    border-left: 1px solid var(--jfx-text-box-border);
    border-right: 1px solid var(--jfx-shadow-highlight);
    height: 100%;
    width: 0;
  }
</style>
<hr class="line" part="line" role="separator">
`;

class JfxSeparator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const vertical = this.getAttribute('orientation') === 'vertical';
    this.shadowRoot.querySelector('.line').setAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal');
  }
}

customElements.define('jfx-separator', JfxSeparator);
