const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    width: 2.5em;
    height: 2.5em;
  }

  /* ── Indeterminate: 12-segment spinner ── */
  .spinner {
    position: relative;
    width: 100%;
    height: 100%;
    animation: spin 4s linear infinite;
  }

  .segment {
    position: absolute;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--jfx-accent);
    top: 50%;
    left: 50%;
  }

  /* 12 segments positioned in a circle (r ≈ 45% of container) */
  .segment:nth-child(1)  { transform: translate(-50%,-50%) rotate(0deg)   translateY(-130%) ; opacity: 1.0; }
  .segment:nth-child(2)  { transform: translate(-50%,-50%) rotate(30deg)  translateY(-130%) ; opacity: 0.93; }
  .segment:nth-child(3)  { transform: translate(-50%,-50%) rotate(60deg)  translateY(-130%) ; opacity: 0.86; }
  .segment:nth-child(4)  { transform: translate(-50%,-50%) rotate(90deg)  translateY(-130%) ; opacity: 0.78; }
  .segment:nth-child(5)  { transform: translate(-50%,-50%) rotate(120deg) translateY(-130%) ; opacity: 0.71; }
  .segment:nth-child(6)  { transform: translate(-50%,-50%) rotate(150deg) translateY(-130%) ; opacity: 0.64; }
  .segment:nth-child(7)  { transform: translate(-50%,-50%) rotate(180deg) translateY(-130%) ; opacity: 0.57; }
  .segment:nth-child(8)  { transform: translate(-50%,-50%) rotate(210deg) translateY(-130%) ; opacity: 0.50; }
  .segment:nth-child(9)  { transform: translate(-50%,-50%) rotate(240deg) translateY(-130%) ; opacity: 0.43; }
  .segment:nth-child(10) { transform: translate(-50%,-50%) rotate(270deg) translateY(-130%) ; opacity: 0.36; }
  .segment:nth-child(11) { transform: translate(-50%,-50%) rotate(300deg) translateY(-130%) ; opacity: 0.28; }
  .segment:nth-child(12) { transform: translate(-50%,-50%) rotate(330deg) translateY(-130%) ; opacity: 0.21; }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── Determinate: circular progress ── */
  .determinate {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .ring-bg, .ring-fg {
    position: absolute;
    inset: 0;
    border-radius: 50%;
  }

  .ring-bg {
    border: 3px solid var(--jfx-box-border);
    background: radial-gradient(circle,
      var(--jfx-control-inner-bg) 70%,
      var(--jfx-control-inner-shadow) 100%);
  }

  .ring-fg {
    border: 3px solid transparent;
    background: transparent;
  }

  svg.ring-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .ring-path {
    fill: none;
    stroke: var(--jfx-accent);
    stroke-width: 3;
    stroke-linecap: butt;
    transition: stroke-dashoffset 0.3s ease;
  }

  .pct-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75em;
    color: var(--jfx-text-bg-color);
  }

  .tick {
    display: none;
  }
  :host([value="1"]) .tick {
    display: flex;
  }
  :host([value="1"]) .pct-text span {
    display: none;
  }
  .tick svg {
    width: 0.9em;
    height: 0.9em;
  }

  :host([disabled]) {
    opacity: 0.4;
  }
</style>

<div class="spinner" part="spinner">
  <div class="segment"></div><div class="segment"></div><div class="segment"></div>
  <div class="segment"></div><div class="segment"></div><div class="segment"></div>
  <div class="segment"></div><div class="segment"></div><div class="segment"></div>
  <div class="segment"></div><div class="segment"></div><div class="segment"></div>
</div>
<div class="determinate" part="determinate" style="display:none">
  <div class="ring-bg"></div>
  <svg class="ring-svg" viewBox="0 0 40 40">
    <circle class="ring-path" cx="20" cy="20" r="17" />
  </svg>
  <div class="pct-text">
    <span></span>
    <div class="tick"><svg viewBox="-1 -2 18 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M-0.25,6.083c0.843-0.758,4.583,4.833,5.75,4.833S14.5-1.5,15.917-0.917c1.292,0.532-8.75,17.083-10.5,17.083C3,16.167-1.083,6.833-0.25,6.083z" fill="white"/>
    </svg></div>
  </div>
</div>
`;

const CIRCUMFERENCE = 2 * Math.PI * 17;

class JfxProgressIndicator extends HTMLElement {
  static observedAttributes = ['value', 'disabled'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._spinner = this.shadowRoot.querySelector('.spinner');
    this._determinate = this.shadowRoot.querySelector('.determinate');
    this._circle = this.shadowRoot.querySelector('.ring-path');
    this._pctText = this.shadowRoot.querySelector('.pct-text span');
  }

  connectedCallback() {
    this.setAttribute('role', 'progressbar');
    this._sync();
  }

  attributeChangedCallback() { this._sync(); }

  get value() {
    const v = this.getAttribute('value');
    return v === null ? -1 : parseFloat(v);
  }
  set value(v) {
    if (v < 0) this.removeAttribute('value');
    else this.setAttribute('value', String(Math.max(0, Math.min(1, v))));
  }

  _sync() {
    const v = this.value;
    if (v < 0) {
      this._spinner.style.display = '';
      this._determinate.style.display = 'none';
      this.removeAttribute('aria-valuenow');
    } else {
      this._spinner.style.display = 'none';
      this._determinate.style.display = '';
      const pct = Math.round(v * 100);
      this._pctText.textContent = pct + '%';
      this._circle.style.strokeDasharray = CIRCUMFERENCE;
      this._circle.style.strokeDashoffset = CIRCUMFERENCE * (1 - v);
      this.setAttribute('aria-valuenow', String(pct));

      if (v >= 1) {
        this._circle.style.stroke = '#57b757';
        this.shadowRoot.querySelector('.ring-bg').style.background = '#57b757';
      }
    }
  }
}

customElements.define('jfx-progress-indicator', JfxProgressIndicator);
