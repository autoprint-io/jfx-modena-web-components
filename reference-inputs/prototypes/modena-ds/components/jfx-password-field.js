const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline-flex;
    vertical-align: middle;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    min-width: 12em;
  }

  input {
    all: unset;
    box-sizing: border-box;
    width: 100%;
    font: inherit;
    color: var(--jfx-text-inner-color);
    cursor: text;

    background: linear-gradient(to bottom,
      var(--jfx-control-inner-shadow) 0px,
      var(--jfx-control-inner-bg) 5px);
    border: 1px solid var(--jfx-text-box-border);
    border-top-color: var(--jfx-text-box-border-top);
    border-radius: 3px;
    padding: 0.333em 0.583em;

    &::selection {
      background: var(--jfx-highlight-fill);
      color: var(--jfx-text-inner-color);
    }

    &::placeholder {
      color: var(--jfx-prompt-text);
    }
  }

  input:focus {
    border-color: var(--jfx-focus-color);
    box-shadow: 0 0 0 1.4px var(--jfx-faint-focus-color);
    outline: none;

    &::selection {
      background: var(--jfx-accent);
      color: white;
    }

    &::placeholder {
      color: transparent;
    }
  }

  :host([disabled]) {
    opacity: 0.4;
    pointer-events: none;
  }
  :host([disabled]) input {
    cursor: default;
  }
</style>
<input part="input" type="password">
`;

class JfxPasswordField extends HTMLElement {
  static observedAttributes = ['placeholder', 'disabled', 'readonly', 'maxlength'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._input = this.shadowRoot.querySelector('input');
  }

  connectedCallback() {
    this._syncAttrs();
    this._input.addEventListener('input', this._onInput);
    this._input.addEventListener('change', this._onChange);
  }

  disconnectedCallback() {
    this._input.removeEventListener('input', this._onInput);
    this._input.removeEventListener('change', this._onChange);
  }

  get value() { return this._input.value; }
  set value(v) { this._input.value = v; }

  attributeChangedCallback() { this._syncAttrs(); }

  _syncAttrs() {
    const input = this._input;
    if (!input) return;
    input.placeholder = this.getAttribute('placeholder') || '';
    input.disabled = this.hasAttribute('disabled');
    input.readOnly = this.hasAttribute('readonly');
    const ml = this.getAttribute('maxlength');
    if (ml) input.maxLength = parseInt(ml);
  }

  focus() { this._input.focus(); }

  _onInput = () => {
    this.dispatchEvent(new Event('input', { bubbles: true }));
  };

  _onChange = () => {
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };
}

customElements.define('jfx-password-field', JfxPasswordField);
