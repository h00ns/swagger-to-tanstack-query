/** Locale support for the documentation. Docs are localized; the landing and
 *  playground stay in English. English lives at `/docs/...`, Korean at `/ko/docs/...`. */
export const locales = ["en", "ko"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  ko: "한국어",
};

/** UI strings (site chrome). Doc page content is localized via the MDX files. */
export const ui = {
  en: {
    "nav.docs": "Docs",
    "nav.playground": "Playground",
    "nav.github": "GitHub",
    "cta.playground": "Open Playground",
    "docs.onThisPage": "On this page",
    "footer.docs": "Docs",
    "footer.project": "Project",
    "footer.tagline":
      "Generate fully-typed TanStack Query code from a Swagger/OpenAPI spec — split by controller, using your own axios instance.",
    "lang.label": "Language",
  },
  ko: {
    "nav.docs": "문서",
    "nav.playground": "플레이그라운드",
    "nav.github": "GitHub",
    "cta.playground": "플레이그라운드 열기",
    "docs.onThisPage": "이 페이지 목차",
    "footer.docs": "문서",
    "footer.project": "프로젝트",
    "footer.tagline":
      "Swagger/OpenAPI 스펙에서 완전히 타입이 입혀진 TanStack Query 코드를 컨트롤러 단위로 생성합니다. 여러분의 axios 인스턴스를 그대로 사용합니다.",
    "lang.label": "언어",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof ui)["en"];

export function t(locale: Locale, key: UIKey): string {
  return ui[locale][key] ?? ui[defaultLocale][key];
}

/** Resolve the active locale from a URL pathname. */
export function localeFromPath(pathname: string): Locale {
  return pathname === "/ko" || pathname.startsWith("/ko/") ? "ko" : "en";
}

/** Strip the `en/` or `ko/` prefix from a content-collection id to get the slug. */
export function slugFromId(id: string): string {
  return id.replace(/^(en|ko)\//, "");
}

/** Build a docs URL for a locale + slug (e.g. ("ko","configuration") → /ko/docs/configuration). */
export function docsPath(locale: Locale, slug: string): string {
  return locale === "en" ? `/docs/${slug}` : `/ko/docs/${slug}`;
}

/** Given the current pathname and a target locale, return the equivalent URL. */
export function switchLocalePath(pathname: string, target: Locale): string {
  const p = pathname.replace(/\/+$/, "") || "/";
  const match = p.match(/^\/(?:ko\/)?docs\/(.+)$/);
  if (match) return docsPath(target, match[1]);
  // Landing (and any other non-docs page) → the locale's landing root.
  // The playground isn't localized, so switching there also lands on the home page.
  return target === "ko" ? "/ko" : "/";
}
