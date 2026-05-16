const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
  }

  a {
    all: unset;
    cursor: pointer;
    color: var(--jfx-accent);
    padding: 0.167em 0.25em;
    border: 1px solid transparent;
    border-radius: 1px;
    text-decoration: none;
  }

  /* Hover — underline, keep accent color */
  a:hover {
    text-decoration: underline;
  }

  /* Visited — dark text, underline */
  :host([visited]) a {
    color: var(--jfx-text-bg-color);
    text-decoration: underline;
  }

  /* Visited + hover — back to accent, underline */
  :host([visited]) a:hover {
    color: var(--jfx-accent);
    text-decoration: underline;
  }

  /* Active/armed — dark text, no underline */
  a:active {
    color: var(--jfx-text-bg-color);
    text-decoration: none;
  }

  /* Focus — dashed blue border (matches JavaFX segments border) */
  a:focus-visible {
    border-color: var(--jfx-focus-color);
    border-style: dashed;
    outline: none;
  }

  :host([disabled]) a {
    opacity: 0.4;
    pointer-events: none;
  }
</style>
<a part="link" role="link"><slot></slot></a>
`;

class JfxHyperlink extends HTMLElement {
  static observedAttributes = ['href', 'disabled'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._link = this.shadowRoot.querySelector('a');
  }

  connectedCallback() {
    this._link.addEventListener('click', this._onClick);
    this._syncHref();
  }

  disconnectedCallback() {
    this._link.removeEventListener('click', this._onClick);
  }

  attributeChangedCallback(name) {
    if (name === 'href') this._syncHref();
  }

  _syncHref() {
    const href = this.getAttribute('href');
    if (href) {
      this._link.href = href;
    } else {
      this._link.removeAttribute('href');
    }
  }

  _onClick = () => {
    this.setAttribute('visited', '');
  };
}

customElements.define('jfx-hyperlink', JfxHyperlink);
