const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 10000;
    align-items: center;
    justify-content: center;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
  }

  :host([open]) {
    display: flex;
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
  }

  .dialog {
    position: relative;
    z-index: 1;
    min-width: 18em;
    max-width: 30em;
    background: var(--jfx-background);
    border: 1px solid var(--jfx-outer-border);
    border-radius: 4px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    overflow: hidden;
  }

  /* ── Header ── */
  .header {
    display: none;
    padding: 0.833em;
    background: linear-gradient(to bottom,
      var(--jfx-background),
      var(--jfx-dialog-header-bot));
    border-bottom: 1px solid var(--jfx-box-border);
  }

  :host([header]) .header {
    display: flex;
    align-items: center;
    gap: 0.833em;
  }

  .header-text {
    flex: 1;
    font-size: 1.167em;
    font-weight: 600;
    color: var(--jfx-text-bg-color);
  }

  .header-icon {
    width: 2em;
    height: 2em;
    flex-shrink: 0;
  }

  /* ── Content ── */
  .content {
    padding: 1.333em 0.833em 0.833em;
    color: var(--jfx-text-bg-color);
  }

  :host([header]) .content {
    padding: 0.833em;
  }

  /* ── Button bar ── */
  .button-bar {
    display: flex;
    justify-content: flex-end;
    gap: 0.5em;
    padding: 0.833em;
  }

  /* ── Alert type icons ── */
  .icon-info, .icon-warn, .icon-error, .icon-confirm {
    width: 2em;
    height: 2em;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2em;
    font-weight: bold;
    color: white;
    flex-shrink: 0;
  }
  .icon-info { background: var(--jfx-accent); }
  .icon-warn { background: #f0ad4e; }
  .icon-error { background: #d9534f; }
  .icon-confirm { background: var(--jfx-accent); }
</style>
<div class="overlay" part="overlay"></div>
<div class="dialog" part="dialog" role="dialog" aria-modal="true">
  <div class="header" part="header">
    <span class="header-icon" part="icon"></span>
    <span class="header-text" part="header-text"><slot name="header"></slot></span>
  </div>
  <div class="content" part="content">
    <slot></slot>
  </div>
  <div class="button-bar" part="buttons">
    <slot name="buttons"></slot>
  </div>
</div>
`;

class JfxDialog extends HTMLElement {
  static observedAttributes = ['open', 'type', 'header'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._overlay = this.shadowRoot.querySelector('.overlay');
    this._icon = this.shadowRoot.querySelector('.header-icon');
  }

  connectedCallback() {
    this._overlay.addEventListener('click', () => this.close());
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
    this._syncType();
  }

  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.setAttribute('open', '') : this.removeAttribute('open'); }

  attributeChangedCallback(name) {
    if (name === 'type') this._syncType();
  }

  show() { this.open = true; }
  close() {
    this.open = false;
    this.dispatchEvent(new Event('close', { bubbles: true }));
  }

  _syncType() {
    const type = this.getAttribute('type') || '';
    const icons = { info: 'i', warning: '!', error: '✕', confirmation: '?' };
    const colors = { info: 'icon-info', warning: 'icon-warn', error: 'icon-error', confirmation: 'icon-confirm' };
    if (type && icons[type]) {
      this._icon.className = 'header-icon ' + (colors[type] || '');
      this._icon.textContent = icons[type];
      this._icon.style.display = '';
    } else {
      this._icon.style.display = 'none';
    }
  }
}

customElements.define('jfx-dialog', JfxDialog);
