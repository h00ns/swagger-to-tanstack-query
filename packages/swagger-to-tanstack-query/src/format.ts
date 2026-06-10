import * as prettier from "prettier";

/** Best-effort Prettier formatting; falls back to the raw string on error. */
export async function format(code: string): Promise<string> {
  try {
    return await prettier.format(code, {
      parser: "typescript",
      semi: true,
      singleQuote: false,
      trailingComma: "all",
    });
  } catch {
    return code;
  }
}
