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

/** JS/TS keywords that cannot be used as identifiers in value position. */
const RESERVED = new Set([
  "break", "case", "catch", "class", "const", "continue", "debugger", "default",
  "delete", "do", "else", "enum", "export", "extends", "false", "finally", "for",
  "function", "if", "import", "in", "instanceof", "new", "null", "return", "super",
  "switch", "this", "throw", "true", "try", "typeof", "var", "void", "while", "with",
  "let", "static", "yield", "await", "async", "implements", "interface", "package",
  "private", "protected", "public",
]);

/** Append `_` to reserved words so they're valid identifiers. */
export function escapeReserved(name: string): string {
  return RESERVED.has(name) ? `${name}_` : name;
}

/** Turn any string into a safe JS identifier (used for path params, fn names). */
export function safeIdentifier(input: string): string {
  const c = camelCase(input);
  const safe = /^[0-9]/.test(c) ? `_${c}` : c || "_";
  return escapeReserved(safe);
}

/** A valid TS object-property key: bare when possible, otherwise quoted. */
export function propertyKey(name: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? name : JSON.stringify(name);
}

/** Indent every line of a block by `n` levels of two spaces. */
export function indent(code: string, n = 1): string {
  const pad = "  ".repeat(n);
  return code
    .split("\n")
    .map((line) => (line.length ? pad + line : line))
    .join("\n");
}
