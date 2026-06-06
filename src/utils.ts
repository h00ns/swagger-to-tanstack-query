/** Split an arbitrary string into word tokens. */
function words(input: string): string[] {
  return (
    input
      // split camelCase / PascalCase boundaries
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      // non-alphanumeric -> space
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
  );
}

export function kebabCase(input: string): string {
  return words(input).map((w) => w.toLowerCase()).join("-");
}

export function camelCase(input: string): string {
  const w = words(input);
  if (w.length === 0) return "";
  return (
    w[0].toLowerCase() +
    w
      .slice(1)
      .map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
      .join("")
  );
}

export function pascalCase(input: string): string {
  return words(input)
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
    .join("");
}

/** Turn any string into a safe JS identifier (used for param names). */
export function safeIdentifier(input: string): string {
  const c = camelCase(input);
  return /^[0-9]/.test(c) ? `_${c}` : c || "_";
}

/** Indent every line of a block by `n` levels of two spaces. */
export function indent(code: string, n = 1): string {
  const pad = "  ".repeat(n);
  return code
    .split("\n")
    .map((line) => (line.length ? pad + line : line))
    .join("\n");
}
