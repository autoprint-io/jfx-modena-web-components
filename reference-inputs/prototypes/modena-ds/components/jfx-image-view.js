const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: inline-block;
    line-height: 0;
  }
  img {
    display: block;
    max-width: 100%;
    height: auto;
  }
  :host([fit-width]) img { width: 100%; }
  :host([fit-height]) img { height: 100%; width: auto; }
  :host([preserve-ratio]) img { object-fit: contain; }
</style>
<img part="image">
`;

class JfxImageView extends HTMLElement {
  static observedAttributes = ['src', 'alt', 'width', 'height'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._img = this.shadowRoot.querySelector('img');
  }

  attributeChangedCallback() { this._sync(); }
  connectedCallback() { this._sync(); }

  _sync() {
    this._img.src = this.getAttribute('src') || '';
    this._img.alt = this.getAttribute('alt') || '';
    const w = this.getAttribute('width');
    const h = this.getAttribute('height');
    if (w) this._img.style.width = w + (isNaN(w) ? '' : 'px');
    if (h) this._img.style.height = h + (isNaN(h) ? '' : 'px');
  }
}

customElements.define('jfx-image-view', JfxImageView);
