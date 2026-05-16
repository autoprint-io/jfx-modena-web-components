export interface JfxElementOptions {
  readonly styles?: string;
  readonly template?: string;
  readonly delegatesFocus?: boolean;
}

export abstract class JfxElement extends HTMLElement {
  protected readonly root: ShadowRoot;

  protected constructor(options: JfxElementOptions = {}) {
    super();

    this.root = this.attachShadow({
      mode: "open",
      delegatesFocus: options.delegatesFocus ?? false,
    });

    if (options.styles || options.template) {
      this.renderShadow(options);
    }
  }

  protected renderShadow(options: JfxElementOptions): void {
    const styles = options.styles ? `<style>${options.styles}</style>` : "";
    const template = options.template ?? "";
    this.root.innerHTML = `${styles}${template}`;
  }

  protected hasBooleanAttribute(name: string): boolean {
    return this.hasAttribute(name);
  }

  protected setBooleanAttribute(name: string, value: boolean): void {
    if (value) {
      this.setAttribute(name, "");
    } else {
      this.removeAttribute(name);
    }
  }
}
