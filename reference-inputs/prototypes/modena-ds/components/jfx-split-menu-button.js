const SVG_ARROW = `<svg viewBox="0 0 4 7" xmlns="http://www.w3.org/2000/svg"><path d="M0-3.5L4 0L0 3.5z" fill="var(--jfx-mark-color)" transform="translate(0,3.5)"/></svg>`;

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline-flex;
    vertical-align: middle;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    position: relative;
  }

  /* ── Outer wrapper: shadow highlight + outer border ── */
  .wrapper {
    display: inline-flex;
    border-radius: 3px;
    border: 1px solid var(--jfx-normal-outer-border);
    box-shadow: 0 1px 0 0 var(--jfx-shadow-highlight);
    overflow: hidden;
  }

  :host(:focus-visible) .wrapper {
    border-color: var(--jfx-focus-color);
    box-shadow: 0 0 0 1.4px var(--jfx-faint-focus-color);
  }
  :host(:focus-visible) { outline: none; }

  /* ── Action label (left) ── */
  .label-part {
    all: unset;
    display: flex;
    align-items: center;
    padding: 0.333em 0.667em;
    cursor: default;
    font: inherit;
    color: var(--jfx-text-base-color);

    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top), var(--jfx-normal-body-bot));
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      inset 0 -1px 0 0 var(--jfx-normal-inner-bot);
  }
  .label-part:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top), var(--jfx-hover-body-bot));
  }
  .label-part:active {
    background: linear-gradient(to bottom,
      var(--jfx-pressed-body-top), var(--jfx-pressed-body-bot));
  }

  /* ── Arrow button (right) ── */
  .arrow-part {
    all: unset;
    display: flex;
    align-items: center;
    padding: 0.5em 0.667em;
    cursor: default;
    border-left: 1px solid var(--jfx-normal-outer-border);

    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top), var(--jfx-normal-body-bot));
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      inset 0 -1px 0 0 var(--jfx-normal-inner-bot);
  }
  .arrow-part:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top), var(--jfx-hover-body-bot));
  }
  :host([open]) .arrow-part,
  .arrow-part:active {
    background: linear-gradient(to bottom,
      var(--jfx-pressed-body-top), var(--jfx-pressed-body-bot));
  }

  .arrow { width: 0.333em; height: 0.583em; line-height: 0; }
  .arrow svg { display: block; width: 100%; height: 100%; }

  .popup {
    display: none; position: absolute; top: calc(100% + 2px); left: 0;
    z-index: 9999; min-width: 100%;
    background: var(--jfx-control-inner-bg);
    border: 1px solid var(--jfx-context-border-top);
    border-radius: 6px; padding: 0.333em 0;
    box-shadow: 0 6px 12px rgba(0,0,0,0.18);
  }
  :host([open]) .popup { display: block; }

  :host([disabled]) { opacity: 0.4; pointer-events: none; }
</style>
<span class="wrapper" part="wrapper">
  <button class="label-part" tabindex="-1" part="label"><slot name="label"></slot></button>
  <button class="arrow-part" tabindex="-1" part="arrow"><span class="arrow">${SVG_ARROW}</span></button>
</span>
<div class="popup" part="popup" role="menu"><slot></slot></div>
`;

class JfxSplitMenuButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');

    this.shadowRoot.querySelector('.label-part').addEventListener('click', () => {
      this.dispatchEvent(new Event('action', { bubbles: true }));
    });

    this.shadowRoot.querySelector('.arrow-part').addEventListener('click', (e) => {
      e.stopPropagation();
      this.hasAttribute('open') ? this.removeAttribute('open') : this.setAttribute('open', '');
    });

    this.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.dispatchEvent(new Event('action', { bubbles: true }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.setAttribute('open', '');
      } else if (e.key === 'Escape') {
        this.removeAttribute('open');
      }
    });

    this._outsideClick = (e) => { if (!this.contains(e.target)) this.removeAttribute('open'); };
    document.addEventListener('click', this._outsideClick);
  }

  disconnectedCallback() { document.removeEventListener('click', this._outsideClick); }
}

customElements.define('jfx-split-menu-button', JfxSplitMenuButton);
