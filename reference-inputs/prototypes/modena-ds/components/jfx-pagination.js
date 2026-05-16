const SVG_LEFT = `<svg viewBox="0 0 13 13" xmlns="http://www.w3.org/2000/svg"><path d="M0 0L-13 7L0 13z" fill="var(--jfx-mark-color)" transform="translate(13,0)"/></svg>`;
const SVG_RIGHT = `<svg viewBox="0 0 13 13" xmlns="http://www.w3.org/2000/svg"><path d="M0 0L13 7L0 13z" fill="var(--jfx-mark-color)"/></svg>`;

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
  }

  .content-area {
    flex: 1;
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 5px 0 0 0;
    font-size: 0.82em;
  }

  /* ── Arrow buttons: pill-shaped ── */
  .arrow-btn {
    all: unset;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    padding: 0.333em 0.5em;

    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top),
      var(--jfx-normal-body-bot));
    border: 1px solid var(--jfx-normal-outer-border);
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      inset 0 -1px 0 0 var(--jfx-normal-inner-bot),
      0 1px 0 0 var(--jfx-shadow-highlight);
  }
  .arrow-btn.left { border-radius: 3px 0 0 3px; }
  .arrow-btn.right { border-radius: 0 3px 3px 0; }

  .arrow-btn:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top),
      var(--jfx-hover-body-bot));
  }
  .arrow-btn:active {
    background: linear-gradient(to bottom,
      var(--jfx-pressed-body-top),
      var(--jfx-pressed-body-bot));
  }

  .arrow-icon {
    width: 0.583em;
    height: 0.75em;
    line-height: 0;
  }
  .arrow-icon svg { display: block; width: 100%; height: 100%; }

  /* ── Pages row ── */
  .pages {
    display: flex;
  }

  /* ── Page number buttons ── */
  .page-btn {
    all: unset;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    padding: 0.167em 0.333em 0.25em 0.333em;
    min-width: 1.5em;
    text-align: center;

    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top),
      var(--jfx-normal-body-bot));
    border: 1px solid var(--jfx-normal-outer-border);
    border-left: none;
    color: var(--jfx-text-base-color);
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      inset 0 -1px 0 0 var(--jfx-normal-inner-bot),
      0 1px 0 0 var(--jfx-shadow-highlight);
  }

  .page-btn:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top),
      var(--jfx-hover-body-bot));
  }

  .page-btn[aria-selected="true"] {
    background: var(--jfx-selection-bar-non-focused);
    color: var(--jfx-text-base-color);
  }

  :host(:focus-within) .page-btn[aria-selected="true"] {
    background: var(--jfx-accent);
    color: white;
  }

  .info {
    text-align: center;
    padding: 0.417em 0 0;
    color: var(--jfx-text-bg-color);
    font-size: 0.9em;
  }
</style>
<div class="content-area" part="content"><slot></slot></div>
<div class="controls" part="controls">
  <button class="arrow-btn left" tabindex="-1" part="prev">
    <span class="arrow-icon">${SVG_LEFT}</span>
  </button>
  <div class="pages" part="pages"></div>
  <button class="arrow-btn right" tabindex="-1" part="next">
    <span class="arrow-icon">${SVG_RIGHT}</span>
  </button>
</div>
<div class="info" part="info"></div>
`;

class JfxPagination extends HTMLElement {
  static observedAttributes = ['page-count', 'current-page'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._pages = this.shadowRoot.querySelector('.pages');
    this._info = this.shadowRoot.querySelector('.info');
    this._prev = this.shadowRoot.querySelector('.arrow-btn.left');
    this._next = this.shadowRoot.querySelector('.arrow-btn.right');
  }

  connectedCallback() {
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this._prev.addEventListener('click', () => this._go(this.currentPage - 1));
    this._next.addEventListener('click', () => this._go(this.currentPage + 1));
    this.addEventListener('keydown', this._onKey);
    this._build();
  }

  get pageCount() { return parseInt(this.getAttribute('page-count')) || 5; }
  get currentPage() { return parseInt(this.getAttribute('current-page')) || 0; }
  set currentPage(v) { this.setAttribute('current-page', String(v)); }

  attributeChangedCallback() { this._build(); }

  _build() {
    if (!this._pages) return;
    this._pages.innerHTML = '';
    for (let i = 0; i < this.pageCount; i++) {
      const btn = document.createElement('button');
      btn.className = 'page-btn';
      btn.textContent = String(i + 1);
      btn.tabIndex = -1;
      btn.setAttribute('aria-selected', i === this.currentPage ? 'true' : 'false');
      btn.addEventListener('click', () => this._go(i));
      this._pages.appendChild(btn);
    }
    this._info.textContent = `Página ${this.currentPage + 1} de ${this.pageCount}`;
  }

  _go(page) {
    page = Math.max(0, Math.min(this.pageCount - 1, page));
    this.currentPage = page;
    this.dispatchEvent(new CustomEvent('page-change', { detail: { page }, bubbles: true }));
  }

  _onKey = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); this._go(this.currentPage + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); this._go(this.currentPage - 1); }
  };
}

customElements.define('jfx-pagination', JfxPagination);
