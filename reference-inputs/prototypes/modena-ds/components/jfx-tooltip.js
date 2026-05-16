const STYLES = `
  :host {
    position: fixed;
    z-index: 10000;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    font-family: var(--jfx-font-family);
    font-size: calc(var(--jfx-font-size) * 0.85);
  }

  :host([visible]) {
    opacity: 1;
  }

  .tip {
    background: rgba(30, 30, 30, 0.8);
    color: white;
    border-radius: 6px;
    padding: 0.667em 0.75em;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
    max-width: 20em;
    word-wrap: break-word;
  }
`;

const template = document.createElement('template');
template.innerHTML = `
<style>${STYLES}</style>
<div class="tip" part="tip" role="tooltip"><slot></slot></div>
`;

class JfxTooltip extends HTMLElement {
  static observedAttributes = ['for', 'visible'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._showTimer = null;
    this._hideTimer = null;
  }

  connectedCallback() {
    this._bindTarget();
  }

  disconnectedCallback() {
    this._unbindTarget();
  }

  attributeChangedCallback(name) {
    if (name === 'for') {
      this._unbindTarget();
      this._bindTarget();
    }
  }

  _bindTarget() {
    const id = this.getAttribute('for');
    this._target = id ? (this.getRootNode() || document).getElementById(id) : this.parentElement;
    if (!this._target) return;
    this._target.addEventListener('mouseenter', this._onEnter);
    this._target.addEventListener('mouseleave', this._onLeave);
    this._target.addEventListener('focusin', this._onEnter);
    this._target.addEventListener('focusout', this._onLeave);
  }

  _unbindTarget() {
    if (!this._target) return;
    this._target.removeEventListener('mouseenter', this._onEnter);
    this._target.removeEventListener('mouseleave', this._onLeave);
    this._target.removeEventListener('focusin', this._onEnter);
    this._target.removeEventListener('focusout', this._onLeave);
    this._target = null;
  }

  _onEnter = (e) => {
    clearTimeout(this._hideTimer);
    this._showTimer = setTimeout(() => {
      this._position(e);
      this.setAttribute('visible', '');
    }, 600);
  };

  _onLeave = () => {
    clearTimeout(this._showTimer);
    this._hideTimer = setTimeout(() => {
      this.removeAttribute('visible');
    }, 100);
  };

  _position(e) {
    if (!this._target) return;
    const rect = this._target.getBoundingClientRect();
    this.style.left = rect.left + 'px';
    this.style.top = (rect.bottom + 6) + 'px';
  }
}

customElements.define('jfx-tooltip', JfxTooltip);
