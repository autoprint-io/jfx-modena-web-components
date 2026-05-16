export type HTMLResult = string;

export function html(strings: TemplateStringsArray, ...values: unknown[]): HTMLResult {
  return strings.reduce((result, string, index) => {
    return `${result}${string}${index < values.length ? String(values[index]) : ""}`;
  }, "");
}

export function createTemplate(htmlText: string): HTMLTemplateElement {
  const template = document.createElement("template");
  template.innerHTML = htmlText;
  return template;
}
