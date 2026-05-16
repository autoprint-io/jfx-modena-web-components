const SVG_CLOSE = `<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><path d="M0 0H1L4 3 7 0H8V1L5 4 8 7V8H7L4 5 1 8H0V7L3 4 0 1Z" fill="var(--jfx-mark-color)"/></svg>`;

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
  }

  /* ── Tab header area ── */
  .header {
    display: flex;
    align-items: flex-end;
    gap: 0;
    padding: 0.417em 0.417em 0 0.417em;
    background: linear-gradient(to bottom,
      var(--jfx-text-box-border) 0px,
      var(--jfx-scrollbar-border) 5px);
    border-bottom: 1px solid var(--jfx-outer-border);
  }

  /* ── Individual tab ── */
  .tab {
    display: flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.083em 0.5em 0.077em 0.5em;
    cursor: default;
    user-select: none;
    color: var(--jfx-text-base-color);
    position: relative;
    bottom: -1px;
    margin-right: 1px;

    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top),
      var(--jfx-normal-body-bot));
    border: 1px solid var(--jfx-normal-outer-border);
    border-bottom: 1px solid var(--jfx-outer-border);
    border-radius: 3px 3px 0 0;
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top);
  }

  .tab:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top),
      var(--jfx-hover-body-bot));
    border-color: var(--jfx-hover-outer-border);
    border-bottom-color: var(--jfx-outer-border);
  }

  .tab[aria-selected="true"] {
    background: var(--jfx-background);
    border-color: var(--jfx-normal-outer-border);
    border-bottom-color: var(--jfx-background);
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top);
    z-index: 1;
  }

  .tab-close {
    all: unset;
    width: 0.667em;
    height: 0.667em;
    line-height: 0;
    cursor: default;
    opacity: 0.5;
    display: none;
  }
  .tab-close:hover { opacity: 1; }
  .tab-close svg { width: 100%; height: 100%; display: block; }

  :host([closable]) .tab-close { display: inline-block; }

  /* ── Content area ── */
  .content {
    flex: 1;
    background: var(--jfx-background);
    border: 1px solid var(--jfx-outer-border);
    border-top: none;
    padding: 0.667em;
  }

  ::slotted([slot]) {
    display: none;
  }
  ::slotted([slot][active]) {
    display: block;
  }

  :host([disabled]) {
    opacity: 0.4;
    pointer-events: none;
  }
</style>
<div class="header" part="header" role="tablist"></div>
<div class="content" part="content">
  <slot></slot>
</div>
`;

class JfxTabPane extends HTMLElement {
  static observedAttributes = ['closable'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._header = this.shadowRoot.querySelector('.header');
    this._observer = null;
  }

  connectedCallback() {
    this._buildTabs();
    this._observer = new MutationObserver(() => this._buildTabs());
    this._observer.observe(this, { childList: true, attributes: true, subtree: true, attributeFilter: ['label', 'active'] });
  }

  disconnectedCallback() {
    this._observer?.disconnect();
  }

  _buildTabs() {
    this._observer?.disconnect();
    this._header.innerHTML = '';
    const panels = [...this.querySelectorAll('[slot]')];
    let hasActive = panels.some(p => p.hasAttribute('active'));

    panels.forEach((panel, i) => {
      const label = panel.getAttribute('label') || `Tab ${i + 1}`;
      const isActive = panel.hasAttribute('active');
      if (!hasActive && i === 0) {
        panel.setAttribute('active', '');
        hasActive = true;
      }

      const tab = document.createElement('div');
      tab.className = 'tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', isActive || (!hasActive && i === 0) ? 'true' : 'false');
      tab.textContent = label;

      if (this.hasAttribute('closable')) {
        const close = document.createElement('button');
        close.className = 'tab-close';
        close.innerHTML = SVG_CLOSE;
        close.addEventListener('click', (e) => {
          e.stopPropagation();
          panel.remove();
          this.dispatchEvent(new CustomEvent('tab-close', { detail: { index: i }, bubbles: true }));
        });
        tab.appendChild(close);
      }

      tab.addEventListener('click', () => this._selectTab(panels, i));
      this._header.appendChild(tab);
    });

    this._observer?.observe(this, { childList: true, attributes: true, subtree: true, attributeFilter: ['label', 'active'] });
  }

  _selectTab(panels, index) {
    panels.forEach((p, i) => {
      if (i === index) p.setAttribute('active', '');
      else p.removeAttribute('active');
    });
    this._buildTabs();
    this.dispatchEvent(new CustomEvent('tab-change', { detail: { index }, bubbles: true }));
  }
}

customElements.define('jfx-tab-pane', JfxTabPane);
