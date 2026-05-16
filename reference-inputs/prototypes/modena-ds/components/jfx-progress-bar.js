const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline-flex;
    vertical-align: middle;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    min-width: 10em;
    height: 1.5em;
  }

  .track {
    position: relative;
    width: 100%;
    border-radius: 4px;
    overflow: hidden;

    /* ── Modena track: 3-layer ──
       Layer 0: shadow highlight (bottom edge)
       Layer 1: border gradient (darker top)
       Layer 2: inner gradient (subtle banding) */
    background: linear-gradient(to bottom,
      var(--jfx-progress-track-1),
      var(--jfx-progress-track-2),
      var(--jfx-progress-track-3),
      var(--jfx-progress-track-4));
    border: 1px solid var(--jfx-text-box-border);
    border-top-color: var(--jfx-text-box-border-top);
    box-shadow: 0 1px 0 0 var(--jfx-shadow-highlight);
  }

  .bar {
    position: absolute;
    top: 2px;
    left: 2px;
    bottom: 3px;
    border-radius: 2px;
    width: 0%;
    transition: width 0.3s ease;

    /* ── Modena bar: accent gradient ── */
    background: linear-gradient(to bottom,
      var(--jfx-progress-fill-1),
      var(--jfx-progress-fill-2),
      var(--jfx-progress-fill-3),
      var(--jfx-progress-fill-4));
  }

  /* ── Indeterminate: JavaFX bounce with gradient flip ──
     Bar slides right (accent leads), then reverses with
     flipped gradient so accent always leads the motion.
     escape=true: bar exits track edges slightly. */
  :host([indeterminate]) .bar {
    width: 30%;
    animation: indeterminate 4s ease-in-out infinite;
  }

  @keyframes indeterminate {
    0% {
      left: -30%;
      background: linear-gradient(to right, transparent, var(--jfx-accent));
    }
    45% {
      left: 100%;
      background: linear-gradient(to right, transparent, var(--jfx-accent));
    }
    50% {
      left: 100%;
      background: linear-gradient(to left, transparent, var(--jfx-accent));
    }
    95% {
      left: -30%;
      background: linear-gradient(to left, transparent, var(--jfx-accent));
    }
    100% {
      left: -30%;
      background: linear-gradient(to right, transparent, var(--jfx-accent));
    }
  }

  :host([disabled]) {
    opacity: 0.4;
  }
</style>
<div class="track" part="track" role="progressbar" aria-valuemin="0" aria-valuemax="100">
  <div class="bar" part="bar"></div>
</div>
`;

class JfxProgressBar extends HTMLElement {
  static observedAttributes = ['value', 'indeterminate', 'disabled'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._bar = this.shadowRoot.querySelector('.bar');
    this._track = this.shadowRoot.querySelector('.track');
  }

  connectedCallback() { this._syncValue(); }
  attributeChangedCallback() { this._syncValue(); }

  get value() { return parseFloat(this.getAttribute('value')) || 0; }
  set value(v) { this.setAttribute('value', String(Math.max(0, Math.min(1, v)))); }

  _syncValue() {
    if (this.hasAttribute('indeterminate')) {
      this._track.removeAttribute('aria-valuenow');
      return;
    }
    const pct = Math.max(0, Math.min(100, this.value * 100));
    this._bar.style.width = pct + '%';
    this._track.setAttribute('aria-valuenow', String(Math.round(pct)));
  }
}

customElements.define('jfx-progress-bar', JfxProgressBar);
