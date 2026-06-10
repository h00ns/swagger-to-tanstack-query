/**
 * Lazy, memoized Shiki highlighter for the playground island. We create exactly
 * one highlighter (module-level promise) with the site theme + the languages the
 * playground needs, then reuse it for every highlight. Shiki itself is imported
 * dynamically so it never lands in the docs/landing bundles.
 */
import { s2tqNight, PLAYGROUND_LANGS } from "../../lib/shiki-theme";
import type { Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

export const THEME_NAME = "s2tq-night";

export type PlaygroundLang = (typeof PLAYGROUND_LANGS)[number];

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then(({ createHighlighter }) =>
      createHighlighter({
        // The theme object is structurally a Shiki ThemeRegistration.
        themes: [s2tqNight as unknown as Parameters<typeof createHighlighter>[0]["themes"][number]],
        langs: [...PLAYGROUND_LANGS],
      }),
    );
  }
  return highlighterPromise;
}

/** Map a file path to one of the loaded languages. */
export function langForPath(path: string): PlaygroundLang {
  if (path.endsWith(".tsx")) return "tsx";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml";
  if (path.endsWith(".sh") || path.endsWith(".bash")) return "bash";
  return "ts";
}

/** Highlight code to HTML using the shared theme. Returns a `<pre>…</pre>` string. */
export async function highlightCode(code: string, lang: PlaygroundLang): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, { lang, theme: THEME_NAME });
}
