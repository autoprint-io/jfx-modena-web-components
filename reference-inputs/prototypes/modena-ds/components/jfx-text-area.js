const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline-flex;
    vertical-align: top;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    min-width: 14em;
    min-height: 5em;
  }

  textarea {
    all: unset;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    font: inherit;
    color: var(--jfx-text-inner-color);
    cursor: text;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    resize: vertical;

    /* ── Modena textarea: border + inner shadow ──
       Outer border gradient (darker top), inner content has
       a 4px shadow at top fading into near-white */
    background: linear-gradient(to bottom,
      var(--jfx-textarea-inner-shadow) 0px,
      var(--jfx-control-inner-bg) 4px);
    border: 1px solid var(--jfx-text-box-border);
    border-top-color: var(--jfx-text-box-border-top);
    border-radius: 3px;
    padding: 0.25em 0.583em;

    &::selection {
      background: var(--jfx-highlight-fill);
      color: var(--jfx-text-inner-color);
    }

    &::placeholder {
      color: var(--jfx-prompt-text);
    }
  }

  /* ── Focus ── */
  textarea:focus {
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

  /* ── Disabled ── */
  :host([disabled]) {
    opacity: 0.4;
    pointer-events: none;
  }
  :host([disabled]) textarea {
    cursor: default;
    resize: none;
  }
</style>
<textarea part="input"></textarea>
`;

class JfxTextArea extends HTMLElement {
  static observedAttributes = ['value', 'placeholder', 'disabled', 'readonly', 'rows', 'cols', 'maxlength'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._textarea = this.shadowRoot.querySelector('textarea');
  }

  connectedCallback() {
    this._syncAttrs();
    this._textarea.addEventListener('input', this._onInput);
    this._textarea.addEventListener('change', this._onChange);
  }

  disconnectedCallback() {
    this._textarea.removeEventListener('input', this._onInput);
    this._textarea.removeEventListener('change', this._onChange);
  }

  get value() { return this._textarea.value; }
  set value(v) { this._textarea.value = v; }

  attributeChangedCallback() { this._syncAttrs(); }

  _syncAttrs() {
    const ta = this._textarea;
    if (!ta) return;
    ta.placeholder = this.getAttribute('placeholder') || '';
    ta.disabled = this.hasAttribute('disabled');
    ta.readOnly = this.hasAttribute('readonly');
    const rows = this.getAttribute('rows');
    if (rows) ta.rows = parseInt(rows);
    const cols = this.getAttribute('cols');
    if (cols) ta.cols = parseInt(cols);
    const ml = this.getAttribute('maxlength');
    if (ml) ta.maxLength = parseInt(ml);
    if (this.hasAttribute('value') && !ta.value) ta.value = this.getAttribute('value');
  }

  focus() { this._textarea.focus(); }
  select() { this._textarea.select(); }

  _onInput = () => {
    this.dispatchEvent(new Event('input', { bubbles: true }));
  };

  _onChange = () => {
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };
}

customElements.define('jfx-text-area', JfxTextArea);
