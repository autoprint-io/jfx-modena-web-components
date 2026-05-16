const SVG_ARROW = `<svg viewBox="0 0 4 7" xmlns="http://www.w3.org/2000/svg"><path d="M0-3.5L4 0L0 3.5z" fill="var(--jfx-text-bg-color)" transform="translate(0,3.5)"/></svg>`;

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: block;
    font-family: var(--jfx-font-family);
    font-size: var(--jfx-font-size);
    border: 1px solid var(--jfx-box-border);
    border-radius: 2px;
    background: var(--jfx-control-inner-bg);
    overflow-y: auto;
    max-height: 14em;
    outline: none;
  }

  :host(:focus) {
    border-color: var(--jfx-focus-color);
    box-shadow: 0 0 0 1.4px var(--jfx-faint-focus-color);
  }

  .node {
    display: flex;
    align-items: center;
    padding: 0.25em;
    cursor: default;
    color: var(--jfx-text-bg-color);
    user-select: none;
  }

  .node:hover {
    background: var(--jfx-cell-hover-color);
  }

  .node[aria-selected="true"] {
    background: var(--jfx-selection-bar-non-focused);
  }

  :host(:focus) .node[aria-selected="true"] {
    background: var(--jfx-accent);
    color: white;
  }

  .disclosure {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.333em;
    height: 1em;
    flex-shrink: 0;
    cursor: default;
  }

  .arrow {
    width: 0.333em;
    height: 0.583em;
    line-height: 0;
    transition: transform 0.15s ease;
  }
  .arrow svg { display: block; width: 100%; height: 100%; }

  .node[aria-expanded="true"] > .disclosure > .arrow {
    transform: rotate(90deg);
  }

  .leaf-spacer {
    width: 1.333em;
    flex-shrink: 0;
  }

  .label { padding-left: 0.25em; }

  .children {
    padding-left: 1em;
  }

  .children.collapsed {
    display: none;
  }
</style>
<div class="tree" role="tree" part="tree"></div>
`;

class JfxTreeView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._tree = this.shadowRoot.querySelector('.tree');
    this._selected = null;
  }

  connectedCallback() {
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this._buildTree(this, this._tree);
  }

  _buildTree(source, container) {
    for (const item of source.children) {
      if (item.tagName !== 'JFX-TREE-ITEM') continue;
      const hasChildren = item.querySelector('jfx-tree-item');
      const expanded = item.hasAttribute('expanded');
      const label = item.getAttribute('label') || item.textContent.trim();

      const node = document.createElement('div');
      node.className = 'node';
      node.setAttribute('role', 'treeitem');
      node.setAttribute('aria-selected', 'false');

      if (hasChildren) {
        node.setAttribute('aria-expanded', String(expanded));
        const disc = document.createElement('span');
        disc.className = 'disclosure';
        disc.innerHTML = `<span class="arrow">${SVG_ARROW}</span>`;
        disc.addEventListener('click', (e) => {
          e.stopPropagation();
          const isExpanded = node.getAttribute('aria-expanded') === 'true';
          node.setAttribute('aria-expanded', String(!isExpanded));
          childContainer.classList.toggle('collapsed', isExpanded);
        });
        node.appendChild(disc);
      } else {
        const spacer = document.createElement('span');
        spacer.className = 'leaf-spacer';
        node.appendChild(spacer);
      }

      const lbl = document.createElement('span');
      lbl.className = 'label';
      lbl.textContent = label;
      node.appendChild(lbl);

      node.addEventListener('click', () => {
        if (this._selected) this._selected.setAttribute('aria-selected', 'false');
        node.setAttribute('aria-selected', 'true');
        this._selected = node;
        this.dispatchEvent(new CustomEvent('select', { detail: { label }, bubbles: true }));
      });

      container.appendChild(node);

      if (hasChildren) {
        const childContainer = document.createElement('div');
        childContainer.className = 'children' + (expanded ? '' : ' collapsed');
        container.appendChild(childContainer);
        this._buildTree(item, childContainer);
      }
    }
  }
}

customElements.define('jfx-tree-view', JfxTreeView);
customElements.define('jfx-tree-item', class extends HTMLElement {});
