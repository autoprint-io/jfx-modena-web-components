// JavaFX Modena ColorPicker — faithful to reference screenshots analysis
const SVG_ARROW = `<svg viewBox="0 0 7 4" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h7L3.5 4z" fill="var(--jfx-mark-color)"/></svg>`;

const PALETTE = [
  '#00ffff','#008080','#0000ff','#000080','#ff00ff','#ff0000','#800000','#ffff00','#808000','#008000','#00ff00','#00ff7f',
  '#ffffff','#e6e6e6','#cccccc','#b3b3b3','#999999','#808080','#666666','#4d4d4d','#333333','#1a1a1a','#000000','#003300',
  '#003333','#000066','#330066','#660066','#660000','#663300','#666600','#336600','#003300','#003333','#003366','#000033',
  '#003366','#3333cc','#6633cc','#993399','#993333','#996633','#999933','#669933','#339933','#339999','#3366cc','#333399',
  '#336699','#6666ff','#9966ff','#cc66cc','#cc6666','#cc9966','#cccc66','#99cc66','#66cc66','#66cccc','#6699ff','#6666cc',
  '#6699cc','#9999ff','#cc99ff','#ff99cc','#ff9999','#ffcc99','#ffff99','#ccff99','#99ff99','#99ffcc','#99ccff','#9999ff',
  '#99cccc','#ccccff','#e6ccff','#ffccff','#ffcccc','#ffe6cc','#ffffe6','#e6ffe6','#ccffcc','#ccffe6','#cce6ff','#ccccff',
  '#99cccc','#b3b3e6','#ccb3e6','#e6b3d9','#e6b3b3','#e6ccb3','#e6e6b3','#cce6b3','#b3e6b3','#b3e6cc','#b3cce6','#b3b3e6',
  '#cce6e6','#d9d9f2','#e6d9f2','#f2d9ec','#f2d9d9','#f2e6d9','#f2f2d9','#e6f2d9','#d9f2d9','#d9f2e6','#d9e6f2','#d9d9f2',
  '#e6f2f2','#ececf9','#f2ecf9','#f9ecf5','#f9ecec','#f9f2ec','#f9f9ec','#f2f9ec','#ecf9ec','#ecf9f2','#ecf2f9','#ececf9',
];

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host { display: inline-block; font-family: var(--jfx-font-family); font-size: var(--jfx-font-size); line-height: normal; }
  .root { position: relative; display: inline-block; }

  /* ── Trigger ── */
  .picker {
    display: inline-grid; grid-template-columns: 1fr 28px;
    align-items: stretch; min-width: 140px; height: 27px;
    box-sizing: border-box; border-radius: 3px; cursor: default; outline: none;
    background: linear-gradient(to bottom, var(--jfx-normal-body-top), var(--jfx-normal-body-bot));
    border: 1px solid var(--jfx-normal-outer-border);
    box-shadow: inset 0 1px 0 0 var(--jfx-normal-inner-top), inset 0 -1px 0 0 var(--jfx-normal-inner-bot), 0 1px 0 0 var(--jfx-shadow-highlight);
  }
  .picker:hover { background: linear-gradient(to bottom, var(--jfx-hover-body-top), var(--jfx-hover-body-bot)); border-color: var(--jfx-hover-outer-border); }
  :host(:focus-within) .picker { border-color: var(--jfx-focus-color); box-shadow: 0 0 0 1.4px var(--jfx-faint-focus-color), inset 0 1px 0 0 var(--jfx-normal-inner-top); }
  .label-area { display: flex; align-items: center; gap: 0.5em; padding: 0.167em 0.5em; min-width: 0; overflow: hidden; }
  .color-rect { width: 1em; height: 1em; border: 1px solid rgba(0,0,0,0.2); border-radius: 1px; flex-shrink: 0; }
  .color-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--jfx-text-base-color); font-size: 0.92em; }
  .arrow-btn { display: flex; align-items: center; justify-content: center; border-left: 1px solid rgba(0,0,0,0.12); }
  .arrow-icon { width: 0.583em; height: 0.333em; line-height: 0; }
  .arrow-icon svg { display: block; width: 100%; height: 100%; }

  /* ── Palette popup ── */
  .popup {
    display: none; position: absolute; left: 0; top: calc(100% + 2px);
    z-index: 9999; box-sizing: border-box;
    background: var(--jfx-control-inner-bg);
    border: 1px solid var(--jfx-outer-border); border-radius: 6px;
    padding: 0.5em; box-shadow: 0 6px 12px rgba(0,0,0,0.18);
  }
  :host([open]) .popup { display: block; }
  .palette { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1px; }
  .csq {
    all: unset; width: 18px; height: 18px;
    border: 1px solid rgba(0,0,0,0.08); cursor: default; transition: transform 0.1s;
  }
  .csq:hover { transform: scale(1.5); z-index: 1; border-color: var(--jfx-focus-color); box-shadow: 0 0 0 1px var(--jfx-focus-color); }
  .csq.sel { border: 2px solid var(--jfx-focus-color); }
  .custom-link {
    display: block; text-align: center; margin-top: 0.667em; padding-top: 0.5em;
    border-top: 1px solid var(--jfx-box-border);
    color: var(--jfx-accent); cursor: pointer; text-decoration: underline; font-size: 0.92em;
  }

  /* ── Custom Color Dialog ── */
  .cdlg {
    display: none; position: absolute; left: calc(100% + 6px); top: 0;
    z-index: 10000; width: 580px; box-sizing: border-box;
    background: var(--jfx-background);
    border: 1px solid var(--jfx-outer-border); border-radius: 4px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.25);
    overflow: hidden;
  }
  :host([custom-open]) .cdlg { display: block; }

  .cdlg-titlebar {
    text-align: center; font-weight: 600; font-size: 0.95em;
    padding: 0.5em; color: var(--jfx-text-bg-color);
    background: linear-gradient(to bottom, var(--jfx-menubar-body-top), var(--jfx-menubar-body-bot));
    border-bottom: 1px solid var(--jfx-outer-border);
    border-radius: 4px 4px 0 0;
  }

  .cdlg-body { padding: 1em; }
  .cdlg-main { display: flex; gap: 0.75em; }

  /* Left: HSB area + hue strip */
  .cdlg-left { display: flex; gap: 0.5em; }

  .hsb-area {
    width: 240px; height: 200px; cursor: crosshair; position: relative;
    border: 1px solid var(--jfx-box-border); border-radius: 2px;
  }
  .hsb-area .sat-ov { position: absolute; inset: 0; background: linear-gradient(to right, white, transparent); border-radius: 1px; }
  .hsb-area .bri-ov { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, black); border-radius: 1px; }
  .hsb-cur {
    position: absolute; width: 10px; height: 10px; border: 2px solid white;
    border-radius: 50%; box-shadow: 0 0 0 1px rgba(0,0,0,0.4);
    transform: translate(-50%, -50%); pointer-events: none; z-index: 1;
  }

  .hue-strip {
    width: 20px; height: 200px; cursor: pointer; position: relative;
    border: 1px solid var(--jfx-box-border); border-radius: 2px;
    background: linear-gradient(to bottom, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);
  }
  .hue-th {
    position: absolute; left: -2px; right: -2px; height: 6px;
    border: 1px solid rgba(0,0,0,0.4); background: white;
    border-radius: 2px; pointer-events: none; transform: translateY(-50%);
  }

  /* Right: previews + tabs + sliders */
  .cdlg-right { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }

  /* Preview: single bar split in two */
  .preview-labels { display: flex; justify-content: space-between; font-size: 0.8em; font-weight: 600; color: var(--jfx-text-bg-color); margin-bottom: 0.25em; }
  .preview-bar {
    display: flex; height: 2.5em; border: 1px solid var(--jfx-box-border); border-radius: 2px; overflow: hidden;
    margin-bottom: 0.75em;
  }
  .preview-bar > div { flex: 1; }

  /* Tabs */
  .tabs { display: flex; gap: 0; margin-bottom: 0.75em; }
  .tab-btn {
    all: unset; padding: 0.25em 0.75em; cursor: default; font-size: 0.85em;
    border: 1px solid var(--jfx-normal-outer-border); border-bottom: none;
    background: linear-gradient(to bottom, var(--jfx-normal-body-top), var(--jfx-normal-body-bot));
    color: var(--jfx-text-base-color);
  }
  .tab-btn:first-child { border-radius: 3px 0 0 0; }
  .tab-btn:last-child { border-radius: 0 3px 0 0; }
  .tab-btn.active {
    background: var(--jfx-background); border-bottom: 1px solid var(--jfx-background);
    position: relative; z-index: 1; font-weight: 600;
  }
  .tab-panel { border: 1px solid var(--jfx-normal-outer-border); border-radius: 0 0 3px 3px; padding: 0.667em; margin-top: -1px; }

  /* Sliders — filled track left of thumb like Modena */
  .srow { display: flex; align-items: center; gap: 0.5em; margin-bottom: 0.5em; }
  .srow:last-child { margin-bottom: 0; }
  .srow-l { min-width: 6.5em; font-size: 0.9em; color: var(--jfx-text-bg-color); }
  .srow input[type="range"] {
    flex: 1; height: 6px;
    -webkit-appearance: none; appearance: none;
    border-radius: 3px; outline: none; cursor: pointer;
    background: linear-gradient(to right, var(--jfx-accent) var(--fill, 0%), var(--jfx-scrollbar-bg-1) var(--fill, 0%));
  }
  .srow input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; cursor: pointer;
    background: linear-gradient(to bottom, var(--jfx-normal-body-top), var(--jfx-normal-body-bot));
    border: 1px solid var(--jfx-slider-thumb-border-top);
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
  .srow input[type="range"]::-moz-range-thumb {
    width: 16px; height: 16px; border-radius: 50%; cursor: pointer;
    background: linear-gradient(to bottom, var(--jfx-normal-body-top), var(--jfx-normal-body-bot));
    border: 1px solid var(--jfx-slider-thumb-border-top);
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
  .srow input[type="range"]::-moz-range-progress {
    background: var(--jfx-accent); border-radius: 3px; height: 6px;
  }
  .srow-v {
    width: 3em; text-align: right; font: inherit; font-size: 0.85em; padding: 0.167em 0.333em;
    border: 1px solid var(--jfx-text-box-border); border-radius: 2px;
    background: var(--jfx-control-inner-bg); color: var(--jfx-text-inner-color);
  }
  .srow-u { font-size: 0.85em; width: 1em; }

  /* Tab panels */
  .panel-hsb, .panel-rgb, .panel-web { display: none; }
  .panel-hsb.active, .panel-rgb.active, .panel-web.active { display: block; }

  /* Opacity separator */
  .opacity-sep { margin-top: 0.667em; padding-top: 0.667em; border-top: 1px solid var(--jfx-box-border); }

  .cdlg-buttons {
    display: flex; justify-content: flex-end; gap: 0.5em;
    padding: 0.667em 1em; border-top: 1px solid var(--jfx-box-border);
  }

  :host([disabled]) { opacity: 0.4; pointer-events: none; }
</style>
<span class="root" part="root">
  <span class="picker" part="picker" tabindex="0">
    <span class="label-area"><span class="color-rect"></span><span class="color-label"></span></span>
    <span class="arrow-btn"><span class="arrow-icon">${SVG_ARROW}</span></span>
  </span>
  <div class="popup" part="popup">
    <div class="palette"></div>
    <a class="custom-link">Personalizar color...</a>
    <div class="cdlg">
      <div class="cdlg-titlebar">Colores Personalizados</div>
      <div class="cdlg-body">
        <div class="cdlg-main">
          <div class="cdlg-left">
            <div class="hsb-area">
              <div class="sat-ov"></div>
              <div class="bri-ov"></div>
              <div class="hsb-cur"></div>
            </div>
            <div class="hue-strip"><div class="hue-th"></div></div>
          </div>
          <div class="cdlg-right">
            <div class="preview-labels"><span>Color Actual</span><span>Nuevo Color</span></div>
            <div class="preview-bar"><div class="cur-half"></div><div class="new-half"></div></div>
            <div class="tabs">
              <button class="tab-btn active" type="button">HSB</button>
              <button class="tab-btn" type="button">RGB</button>
              <button class="tab-btn" type="button">Web</button>
            </div>
            <div class="tab-panel">
              <div class="panel-hsb active">
                <div class="srow"><span class="srow-l">Matiz:</span><input type="range" class="h-r" min="0" max="360" value="0"><input type="number" class="srow-v h-v" min="0" max="360" value="0"><span class="srow-u">°</span></div>
                <div class="srow"><span class="srow-l">Saturación:</span><input type="range" class="s-r" min="0" max="100" value="100"><input type="number" class="srow-v s-v" min="0" max="100" value="100"><span class="srow-u">%</span></div>
                <div class="srow"><span class="srow-l">Brillo:</span><input type="range" class="b-r" min="0" max="100" value="100"><input type="number" class="srow-v b-v" min="0" max="100" value="100"><span class="srow-u">%</span></div>
              </div>
              <div class="panel-rgb">
                <div class="srow"><span class="srow-l">Rojo:</span><input type="range" class="r-r" min="0" max="255" value="255"><input type="number" class="srow-v r-v" min="0" max="255" value="255"><span class="srow-u"></span></div>
                <div class="srow"><span class="srow-l">Verde:</span><input type="range" class="g-r" min="0" max="255" value="0"><input type="number" class="srow-v g-v" min="0" max="255" value="0"><span class="srow-u"></span></div>
                <div class="srow"><span class="srow-l">Azul:</span><input type="range" class="bl-r" min="0" max="255" value="0"><input type="number" class="srow-v bl-v" min="0" max="255" value="0"><span class="srow-u"></span></div>
              </div>
              <div class="panel-web">
                <div class="srow"><span class="srow-l">Hex:</span><input type="text" class="srow-v web-hex" style="flex:1;width:auto;text-align:left" value="#ff0000" maxlength="7"><span class="srow-u"></span></div>
              </div>
            </div>
            <div class="opacity-sep">
              <div class="srow"><span class="srow-l">Opacidad:</span><input type="range" class="a-r" min="0" max="100" value="100"><input type="number" class="srow-v a-v" min="0" max="100" value="100"><span class="srow-u">%</span></div>
            </div>
          </div>
        </div>
      </div>
      <div class="cdlg-buttons">
        <jfx-button class="btn-save" default>Guardar</jfx-button>
        <jfx-button class="btn-use">Usar</jfx-button>
        <jfx-button class="btn-cancel">Cancelar</jfx-button>
      </div>
    </div>
  </div>
</span>
`;

class JfxColorPicker extends HTMLElement {
  static observedAttributes = ['value', 'disabled', 'open'];
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._$ = (s) => this.shadowRoot.querySelector(s);
    this._hsb = { h: 0, s: 100, b: 100 };
  }

  connectedCallback() {
    this._buildPalette();
    this._syncValue();
    this._$('.picker').addEventListener('click', this._toggle);
    this._$('.custom-link').addEventListener('click', (e) => { e.stopPropagation(); this._openCustom(); });

    // Sliders
    const bind = (rc, vc, key) => {
      const r = this._$(rc), v = this._$(vc);
      const up = () => { this._hsb[key] = +r.value; v.value = r.value; this._updateUI(); };
      r.addEventListener('input', up);
      v.addEventListener('change', () => { r.value = v.value; up(); });
    };
    bind('.h-r', '.h-v', 'h');
    bind('.s-r', '.s-v', 's');
    bind('.b-r', '.b-v', 'b');

    // HSB area drag
    const area = this._$('.hsb-area');
    const pickSB = (e) => {
      const r = area.getBoundingClientRect();
      this._hsb.s = Math.round(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
      this._hsb.b = Math.round(Math.max(0, Math.min(100, (1 - (e.clientY - r.top) / r.height) * 100)));
      this._$('.s-r').value = this._hsb.s; this._$('.s-v').value = this._hsb.s;
      this._$('.b-r').value = this._hsb.b; this._$('.b-v').value = this._hsb.b;
      this._updateUI();
    };
    area.addEventListener('pointerdown', (e) => {
      e.preventDefault(); area.setPointerCapture(e.pointerId); pickSB(e);
      const mv = (ev) => pickSB(ev);
      const up = () => { area.removeEventListener('pointermove', mv); area.removeEventListener('pointerup', up); };
      area.addEventListener('pointermove', mv); area.addEventListener('pointerup', up);
    });

    // Hue strip drag
    const strip = this._$('.hue-strip');
    const pickH = (e) => {
      const r = strip.getBoundingClientRect();
      this._hsb.h = Math.round(Math.max(0, Math.min(360, ((e.clientY - r.top) / r.height) * 360)));
      this._$('.h-r').value = this._hsb.h; this._$('.h-v').value = this._hsb.h;
      this._updateUI();
    };
    strip.addEventListener('pointerdown', (e) => {
      e.preventDefault(); strip.setPointerCapture(e.pointerId); pickH(e);
      const mv = (ev) => pickH(ev);
      const up = () => { strip.removeEventListener('pointermove', mv); strip.removeEventListener('pointerup', up); };
      strip.addEventListener('pointermove', mv); strip.addEventListener('pointerup', up);
    });

    // Buttons
    const apply = () => {
      this.value = this._hsbHex(this._hsb.h, this._hsb.s, this._hsb.b);
      this.removeAttribute('custom-open'); this.open = false;
      this.dispatchEvent(new Event('change', { bubbles: true }));
    };
    this._$('.btn-save').addEventListener('click', apply);
    this._$('.btn-use').addEventListener('click', apply);
    this._$('.btn-cancel').addEventListener('click', () => this.removeAttribute('custom-open'));

    // Tabs — switch between HSB, RGB, Web panels
    const tabs = this.shadowRoot.querySelectorAll('.tab-btn');
    const panels = [this._$('.panel-hsb'), this._$('.panel-rgb'), this._$('.panel-web')];
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        panels[i].classList.add('active');
      });
    });

    // RGB sliders
    const bindRgb = (rc, vc) => {
      const r = this._$(rc), v = this._$(vc);
      const up = () => {
        v.value = r.value;
        const red = +this._$('.r-r').value, grn = +this._$('.g-r').value, blu = +this._$('.bl-r').value;
        const hsb = this._rgb2hsb(red, grn, blu);
        this._hsb = { h: hsb.h, s: hsb.s, b: hsb.b };
        this._syncHsbSliders();
        this._updateUI();
      };
      r.addEventListener('input', up);
      v.addEventListener('change', () => { r.value = v.value; up(); });
    };
    bindRgb('.r-r', '.r-v');
    bindRgb('.g-r', '.g-v');
    bindRgb('.bl-r', '.bl-v');

    // Web hex input
    this._$('.web-hex').addEventListener('change', () => {
      const hex = this._$('.web-hex').value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        const rgb = this._hex2rgb(hex);
        const hsb = this._rgb2hsb(rgb.r, rgb.g, rgb.b);
        this._hsb = { h: hsb.h, s: hsb.s, b: hsb.b };
        this._syncHsbSliders();
        this._updateUI();
      }
    });

    this._outsideClick = (e) => { if (this.open && !this.contains(e.target)) { this.open = false; this.removeAttribute('custom-open'); } };
    document.addEventListener('click', this._outsideClick);
  }

  disconnectedCallback() { document.removeEventListener('click', this._outsideClick); }
  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.setAttribute('open', '') : this.removeAttribute('open'); }
  get value() { return this.getAttribute('value') || '#ffffff'; }
  set value(v) { this.setAttribute('value', v); this._syncValue(); }
  attributeChangedCallback(n) { if (n === 'value') this._syncValue(); }

  _syncValue() {
    this._$('.color-rect').style.background = this.value;
    this._$('.color-label').textContent = this.value;
    for (const sq of this._$('.palette').querySelectorAll('.csq'))
      sq.classList.toggle('sel', sq.dataset.c === this.value.toLowerCase());
  }

  _buildPalette() {
    const p = this._$('.palette'); p.innerHTML = '';
    for (const c of PALETTE) {
      const b = document.createElement('button');
      b.className = 'csq'; b.type = 'button'; b.style.background = c;
      b.dataset.c = c; b.tabIndex = -1;
      b.addEventListener('click', (e) => { e.stopPropagation(); this.value = c; this.open = false; this.dispatchEvent(new Event('change', { bubbles: true })); });
      p.appendChild(b);
    }
  }

  _openCustom() {
    this._$('.cur-half').style.background = this.value;
    const rgb = this._hex2rgb(this.value), hsb = this._rgb2hsb(rgb.r, rgb.g, rgb.b);
    this._hsb = { h: hsb.h, s: hsb.s, b: hsb.b };
    this._$('.h-r').value = hsb.h; this._$('.h-v').value = hsb.h;
    this._$('.s-r').value = hsb.s; this._$('.s-v').value = hsb.s;
    this._$('.b-r').value = hsb.b; this._$('.b-v').value = hsb.b;
    this._updateUI();
    this.setAttribute('custom-open', '');
  }

  _syncHsbSliders() {
    this._$('.h-r').value = this._hsb.h; this._$('.h-v').value = this._hsb.h;
    this._$('.s-r').value = this._hsb.s; this._$('.s-v').value = this._hsb.s;
    this._$('.b-r').value = this._hsb.b; this._$('.b-v').value = this._hsb.b;
  }

  _updateSliderFills() {
    for (const input of this.shadowRoot.querySelectorAll('input[type="range"]')) {
      const min = +input.min, max = +input.max, val = +input.value;
      const pct = ((val - min) / (max - min)) * 100;
      input.style.setProperty('--fill', pct + '%');
    }
  }

  _updateUI() {
    const hex = this._hsbHex(this._hsb.h, this._hsb.s, this._hsb.b);
    this._$('.new-half').style.background = hex;
    this._$('.hsb-area').style.background = `hsl(${this._hsb.h}, 100%, 50%)`;
    this._$('.hue-th').style.top = `${(this._hsb.h / 360) * 100}%`;
    this._$('.hsb-cur').style.left = `${this._hsb.s}%`;
    this._$('.hsb-cur').style.top = `${100 - this._hsb.b}%`;

    // Sync RGB sliders
    const rgb = this._hex2rgb(hex);
    this._$('.r-r').value = rgb.r; this._$('.r-v').value = rgb.r;
    this._$('.g-r').value = rgb.g; this._$('.g-v').value = rgb.g;
    this._$('.bl-r').value = rgb.b; this._$('.bl-v').value = rgb.b;

    // Sync Web hex
    this._$('.web-hex').value = hex;

    // Fill slider tracks
    this._updateSliderFills();
  }

  _toggle = (e) => { e.stopPropagation(); if (!this.hasAttribute('disabled')) { this.open = !this.open; if (!this.open) this.removeAttribute('custom-open'); } };

  _hex2rgb(h) { h=h.replace('#',''); return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)}; }
  _rgb2hsb(r,g,b) {
    r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;
    if(d){if(mx===r)h=60*(((g-b)/d)%6);else if(mx===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4);}
    if(h<0)h+=360;return{h:Math.round(h),s:Math.round(mx?d/mx*100:0),b:Math.round(mx*100)};
  }
  _hsbHex(h,s,b) {
    s/=100;b/=100;const c=b*s,x=c*(1-Math.abs((h/60)%2-1)),m=b-c;let r,g,bl;
    if(h<60)[r,g,bl]=[c,x,0];else if(h<120)[r,g,bl]=[x,c,0];else if(h<180)[r,g,bl]=[0,c,x];
    else if(h<240)[r,g,bl]=[0,x,c];else if(h<300)[r,g,bl]=[x,0,c];else[r,g,bl]=[c,0,x];
    return'#'+[r+m,g+m,bl+m].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');
  }
}
customElements.define('jfx-color-picker', JfxColorPicker);
