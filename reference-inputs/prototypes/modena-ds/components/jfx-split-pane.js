const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: flex;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    border: 1px solid var(--jfx-box-border);
    border-radius: 2px;
    background: var(--jfx-background);
    overflow: hidden;
  }

  :host([orientation="vertical"]) {
    flex-direction: column;
  }

  ::slotted(*) {
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: auto;
  }

  /* ── Divider ── */
  .divider {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: col-resize;
    background: linear-gradient(to right,
      var(--jfx-normal-inner-top),
      var(--jfx-normal-inner-bot));
    border-left: 1px solid var(--jfx-box-border);
    border-right: 1px solid var(--jfx-box-border);
    padding: 0 0.25em;
  }

  :host([orientation="vertical"]) .divider {
    cursor: row-resize;
    background: linear-gradient(to bottom,
      var(--jfx-normal-inner-top),
      var(--jfx-normal-inner-bot));
    border-left: none;
    border-right: none;
    border-top: 1px solid var(--jfx-box-border);
    border-bottom: 1px solid var(--jfx-box-border);
    padding: 0.25em 0;
  }

  .divider:hover {
    background: linear-gradient(to right,
      var(--jfx-hover-inner-top),
      var(--jfx-hover-inner-bot));
  }

  :host(:focus-within) {
    border-color: var(--jfx-focus-color);
    box-shadow: 0 0 0 1.4px var(--jfx-faint-focus-color);
  }
</style>
<slot name="left"></slot>
<div class="divider" part="divider" role="separator"></div>
<slot name="right"></slot>
`;

class JfxSplitPane extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._divider = this.shadowRoot.querySelector('.divider');
  }

  connectedCallback() {
    this._divider.addEventListener('pointerdown', this._onDown);
  }

  get vertical() { return this.getAttribute('orientation') === 'vertical'; }

  _onDown = (e) => {
    e.preventDefault();
    this._divider.setPointerCapture(e.pointerId);
    const slots = this.shadowRoot.querySelectorAll('slot');
    const left = slots[0].assignedElements()[0];
    const right = slots[1].assignedElements()[0];
    if (!left || !right) return;

    const rect = this.getBoundingClientRect();
    const onMove = (e2) => {
      const total = this.vertical ? rect.height : rect.width;
      const pos = this.vertical ? (e2.clientY - rect.top) : (e2.clientX - rect.left);
      const pct = Math.max(10, Math.min(90, (pos / total) * 100));
      left.style.flex = `0 0 ${pct}%`;
      right.style.flex = `1`;
    };
    const onUp = () => {
      this._divider.removeEventListener('pointermove', onMove);
      this._divider.removeEventListener('pointerup', onUp);
    };
    this._divider.addEventListener('pointermove', onMove);
    this._divider.addEventListener('pointerup', onUp);
  };
}

customElements.define('jfx-split-pane', JfxSplitPane);
