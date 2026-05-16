export type CSSResult = string;

export function css(strings: TemplateStringsArray, ...values: unknown[]): CSSResult {
  return strings.reduce((result, string, index) => {
    return `${result}${string}${index < values.length ? String(values[index]) : ""}`;
  }, "");
}
