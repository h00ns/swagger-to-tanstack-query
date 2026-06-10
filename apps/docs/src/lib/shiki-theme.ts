/**
 * `s2tq-night` — the site's custom Shiki/TextMate theme (DESIGN.md §2.3).
 * Tuned on the `--color-surface-inset` (#080B11) code well. Brand cyan is kept
 * OUT of code so the brand and the syntax don't compete. Shared by the
 * build-time code blocks (expressive-code) and the runtime playground highlighter.
 */
export type ThemeRegistration = {
  name: string;
  type: "dark";
  colors: Record<string, string>;
  tokenColors: Array<{ scope: string | string[]; settings: { foreground?: string; fontStyle?: string } }>;
};

const palette = {
  bg: "#080B11",
  fg: "#C9D1E0",
  comment: "#5C6679",
  keyword: "#FF7AB6",
  string: "#8DE98D",
  func: "#5FE6EF",
  type: "#C8A2FF",
  number: "#F2C14E",
  punctuation: "#7E8AA3",
  operator: "#9FB0CC",
  property: "#A9D4FF",
  escape: "#7CE0D0",
} as const;

export const s2tqNight: ThemeRegistration = {
  name: "s2tq-night",
  type: "dark",
  colors: {
    "editor.background": palette.bg,
    "editor.foreground": palette.fg,
  },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: palette.comment, fontStyle: "italic" } },
    {
      scope: [
        "keyword",
        "storage",
        "storage.type",
        "storage.modifier",
        "keyword.control",
        "keyword.operator.new",
        "keyword.operator.expression",
        "variable.language",
      ],
      settings: { foreground: palette.keyword },
    },
    { scope: ["string", "string.quoted", "string.template", "constant.other.symbol"], settings: { foreground: palette.string } },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function", "variable.function"],
      settings: { foreground: palette.func },
    },
    {
      scope: ["entity.name.type", "support.type", "entity.name.class", "support.class", "entity.other.inherited-class"],
      settings: { foreground: palette.type },
    },
    { scope: ["constant.numeric", "constant.language.boolean", "constant.language"], settings: { foreground: palette.number } },
    {
      scope: ["variable.other.property", "meta.object-literal.key", "support.type.property-name", "entity.name.tag.yaml"],
      settings: { foreground: palette.property },
    },
    { scope: ["punctuation", "meta.brace", "punctuation.separator", "punctuation.terminator"], settings: { foreground: palette.punctuation } },
    { scope: ["keyword.operator", "punctuation.accessor"], settings: { foreground: palette.operator } },
    { scope: ["constant.character.escape", "string.regexp"], settings: { foreground: palette.escape } },
    { scope: ["variable", "variable.other", "variable.parameter"], settings: { foreground: palette.fg } },
    { scope: ["entity.name.tag", "support.type.primitive"], settings: { foreground: palette.func } },
  ],
};

/** Languages the playground highlighter must load. */
export const PLAYGROUND_LANGS = ["ts", "tsx", "json", "yaml", "bash"] as const;
