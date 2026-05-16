const SVG_LEFT = `<svg viewBox="0 0 6 9" xmlns="http://www.w3.org/2000/svg"><path d="M6 0L6 1.5 3 4.5 6 7.5 6 9 0 4.5z" fill="var(--jfx-scrollbar-arrow)"/></svg>`;
const SVG_RIGHT = `<svg viewBox="0 0 6 9" xmlns="http://www.w3.org/2000/svg"><path d="M0 0L0 1.5 3 4.5 0 7.5 0 9 6 4.5z" fill="var(--jfx-scrollbar-arrow)"/></svg>`;
const SVG_UP = `<svg viewBox="0 0 9 6" xmlns="http://www.w3.org/2000/svg"><path d="M0 6L1.5 6 4.5 3 7.5 6 9 6 4.5 0z" fill="var(--jfx-scrollbar-arrow)"/></svg>`;
const SVG_DOWN = `<svg viewBox="0 0 9 6" xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1.5 0 4.5 3 7.5 0 9 0 4.5 6z" fill="var(--jfx-scrollbar-arrow)"/></svg>`;

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: flex;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
  }

  /* ── Horizontal ── */
  :host(:not([orientation="vertical"])) {
    flex-direction: row;
    height: 1.25em;
    min-width: 4em;
  }

  :host(:not([orientation="vertical"])) .track {
    flex: 1;
    background: linear-gradient(to bottom,
      var(--jfx-scrollbar-bg-1),
      var(--jfx-scrollbar-bg-2) 50%,
      var(--jfx-scrollbar-bg-1));
    border-top: 1px solid var(--jfx-scrollbar-border);
    border-bottom: 1px solid var(--jfx-scrollbar-border);
    position: relative;
  }

  /* ── Vertical ── */
  :host([orientation="vertical"]) {
    flex-direction: column;
    width: 1.25em;
    min-height: 4em;
  }

  :host([orientation="vertical"]) .track {
    flex: 1;
    background: linear-gradient(to right,
      var(--jfx-scrollbar-bg-1),
      var(--jfx-scrollbar-bg-2) 50%,
      var(--jfx-scrollbar-bg-1));
    border-left: 1px solid var(--jfx-scrollbar-border);
    border-right: 1px solid var(--jfx-scrollbar-border);
    position: relative;
  }

  /* ── Thumb ── */
  .thumb {
    position: absolute;
    border-radius: 3px;
    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top),
      var(--jfx-normal-body-bot));
    border: 1px solid var(--jfx-normal-outer-border);
    box-shadow:
      inset 0 1px 0 0 var(--jfx-normal-inner-top);
    cursor: default;
  }

  :host(:not([orientation="vertical"])) .thumb {
    top: 2px; bottom: 2px;
    min-width: 1.5em;
  }
  :host([orientation="vertical"]) .thumb {
    left: 2px; right: 2px;
    min-height: 1.5em;
    background: linear-gradient(to right,
      var(--jfx-normal-body-top),
      var(--jfx-normal-body-bot));
  }

  .thumb:hover {
    background: linear-gradient(to bottom,
      var(--jfx-hover-body-top),
      var(--jfx-hover-body-bot));
    border-color: var(--jfx-hover-outer-border);
  }
  :host([orientation="vertical"]) .thumb:hover {
    background: linear-gradient(to right,
      var(--jfx-hover-body-top),
      var(--jfx-hover-body-bot));
  }

  .thumb:active {
    background: linear-gradient(to bottom,
      var(--jfx-pressed-body-top),
      var(--jfx-pressed-body-bot));
    border-color: var(--jfx-pressed-outer-border);
  }

  /* ── Arrow buttons ── */
  .arrow-btn {
    all: unset;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    background: linear-gradient(to bottom,
      var(--jfx-normal-body-top),
      var(--jfx-normal-body-bot));
    border: 1px solid var(--jfx-normal-outer-border);
    box-shadow: inset 0 1px 0 0 var(--jfx-normal-inner-top);
  }
  :host(:not([orientation="vertical"])) .arrow-btn {
    padding: 0.25em;
    min-width: 0.75em;
  }
  :host([orientation="vertical"]) .arrow-btn {
    padding: 0.25em;
    min-height: 0.75em;
  }

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
    width: 0.5em;
    height: 0.5em;
    line-height: 0;
  }
  .arrow-icon svg { display: block; width: 100%; height: 100%; }
</style>
<button class="arrow-btn dec" tabindex="-1" part="decrement">
  <span class="arrow-icon dec-icon"></span>
</button>
<div class="track" part="track">
  <div class="thumb" part="thumb"></div>
</div>
<button class="arrow-btn inc" tabindex="-1" part="increment">
  <span class="arrow-icon inc-icon"></span>
</button>
`;

class JfxScrollBar extends HTMLElement {
  static observedAttributes = ['value', 'orientation'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._thumb = this.shadowRoot.querySelector('.thumb');
    this._track = this.shadowRoot.querySelector('.track');
    this._dec = this.shadowRoot.querySelector('.dec');
    this._inc = this.shadowRoot.querySelector('.inc');
  }

  connectedCallback() {
    this._setArrows();
    this._update();
    this._thumb.addEventListener('pointerdown', this._onDown);
    this._dec.addEventListener('click', () => this._step(-0.1));
    this._inc.addEventListener('click', () => this._step(0.1));
  }

  get vertical() { return this.getAttribute('orientation') === 'vertical'; }
  get value() { return parseFloat(this.getAttribute('value')) || 0; }
  set value(v) { this.setAttribute('value', String(Math.max(0, Math.min(1, v)))); }

  attributeChangedCallback(name) {
    if (name === 'orientation') this._setArrows();
    this._update();
  }

  _setArrows() {
    const v = this.vertical;
    this.shadowRoot.querySelector('.dec-icon').innerHTML = v ? SVG_UP : SVG_LEFT;
    this.shadowRoot.querySelector('.inc-icon').innerHTML = v ? SVG_DOWN : SVG_RIGHT;
  }

  _update() {
    const pct = this.value * 100;
    const thumbSize = 30;
    if (this.vertical) {
      this._thumb.style.top = `calc(${pct}% * (1 - ${thumbSize / 100}))`;
      this._thumb.style.height = thumbSize + '%';
      this._thumb.style.left = '2px';
      this._thumb.style.right = '2px';
    } else {
      this._thumb.style.left = `calc(${pct}% * (1 - ${thumbSize / 100}))`;
      this._thumb.style.width = thumbSize + '%';
    }
  }

  _step(delta) {
    this.value = this.value + delta;
    this.dispatchEvent(new Event('scroll', { bubbles: true }));
  }

  _onDown = (e) => {
    e.preventDefault();
    this._thumb.setPointerCapture(e.pointerId);
    const start = this.vertical ? e.clientY : e.clientX;
    const startVal = this.value;
    const trackSize = this.vertical ? this._track.offsetHeight : this._track.offsetWidth;

    const onMove = (e2) => {
      const delta = ((this.vertical ? e2.clientY : e2.clientX) - start) / (trackSize * 0.7);
      this.value = startVal + delta;
      this.dispatchEvent(new Event('scroll', { bubbles: true }));
    };
    const onUp = () => {
      this._thumb.removeEventListener('pointermove', onMove);
      this._thumb.removeEventListener('pointerup', onUp);
    };
    this._thumb.addEventListener('pointermove', onMove);
    this._thumb.addEventListener('pointerup', onUp);
  };
}

customElements.define('jfx-scroll-bar', JfxScrollBar);
