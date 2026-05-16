const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    min-width: 10em;
    height: 1.5em;
    cursor: default;
  }

  .container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
  }

  /* ── Track: inset groove ── */
  .track {
    width: 100%;
    height: 0.5em;
    border-radius: 0.25em;
    background: linear-gradient(to bottom,
      var(--jfx-progress-track-1),
      var(--jfx-progress-track-2),
      var(--jfx-slider-track-3),
      var(--jfx-slider-track-4));
    border: 1px solid var(--jfx-text-box-border);
    border-top-color: var(--jfx-text-box-border-top);
    box-shadow: 0 1px 0 0 var(--jfx-shadow-highlight);
  }

  /* ── Thumb: circular button with shadow ── */
  .thumb {
    position: absolute;
    width: 1.167em;
    height: 1.167em;
    border-radius: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    cursor: pointer;

    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top),
      var(--jfx-normal-body-bot));
    border: 1px solid;
    border-color: var(--jfx-slider-thumb-border-top) var(--jfx-slider-thumb-border-bot) var(--jfx-slider-thumb-border-bot) var(--jfx-slider-thumb-border-top);
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      inset 0 -1px 0 0 var(--jfx-normal-inner-bot),
      0 2px 5px rgba(0,0,0,0.1);
  }

  .thumb:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top),
      var(--jfx-hover-body-bot));
  }

  .thumb:active {
    background: linear-gradient(to bottom,
      var(--jfx-pressed-body-top),
      var(--jfx-pressed-body-bot));
    border-color: var(--jfx-pressed-outer-border);
  }

  /* ── Focus: 5-layer JavaFX pattern on circle ──
     Blue ring (2px) + body fill + faint blue glow outside */
  :host(:focus-visible) .thumb {
    border: 2px solid var(--jfx-focus-color);
    box-shadow:
      0 0 0 2.5px var(--jfx-faint-focus-color),
      inset 0 1px 0 0 var(--jfx-normal-inner-top),
      0 2px 5px rgba(0,0,0,0.1);
  }
  :host(:focus-visible) { outline: none; }

  :host([disabled]) {
    opacity: 0.4;
    pointer-events: none;
  }
</style>
<div class="container" part="container">
  <div class="track" part="track"></div>
  <div class="thumb" part="thumb"></div>
</div>
`;

class JfxSlider extends HTMLElement {
  static observedAttributes = ['value', 'min', 'max', 'disabled'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._thumb = this.shadowRoot.querySelector('.thumb');
    this._track = this.shadowRoot.querySelector('.track');
    this._dragging = false;
  }

  connectedCallback() {
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this.setAttribute('role', 'slider');
    this._thumb.addEventListener('pointerdown', this._onDown);
    this.addEventListener('keydown', this._onKey);
    this._update();
  }

  disconnectedCallback() {
    this._thumb.removeEventListener('pointerdown', this._onDown);
    this.removeEventListener('keydown', this._onKey);
  }

  get min() { return parseFloat(this.getAttribute('min')) || 0; }
  get max() { return parseFloat(this.getAttribute('max')) || 100; }
  get value() { return parseFloat(this.getAttribute('value')) || 0; }
  set value(v) { this.setAttribute('value', String(v)); }

  attributeChangedCallback() { this._update(); }

  _update() {
    const pct = (this.value - this.min) / (this.max - this.min) * 100;
    this._thumb.style.left = `calc(${pct}% + ${0.583 * (1 - pct / 50)}em)`;
    this.setAttribute('aria-valuemin', this.min);
    this.setAttribute('aria-valuemax', this.max);
    this.setAttribute('aria-valuenow', this.value);
  }

  _onDown = (e) => {
    if (this.hasAttribute('disabled')) return;
    e.preventDefault();
    this._dragging = true;
    this._thumb.setPointerCapture(e.pointerId);
    this._thumb.addEventListener('pointermove', this._onMove);
    this._thumb.addEventListener('pointerup', this._onUp);
  };

  _onMove = (e) => {
    if (!this._dragging) return;
    const rect = this._track.getBoundingClientRect();
    let pct = (e.clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    this.value = Math.round(this.min + pct * (this.max - this.min));
    this.dispatchEvent(new Event('input', { bubbles: true }));
  };

  _onUp = () => {
    this._dragging = false;
    this._thumb.removeEventListener('pointermove', this._onMove);
    this._thumb.removeEventListener('pointerup', this._onUp);
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  _onKey = (e) => {
    const step = (this.max - this.min) / 20;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.value = Math.min(this.max, this.value + step);
      this.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.value = Math.max(this.min, this.value - step);
      this.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };
}

customElements.define('jfx-slider', JfxSlider);
