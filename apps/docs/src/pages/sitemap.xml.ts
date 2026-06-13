import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { slugFromId } from "../i18n/ui";

/** Absolute origin for the deployed docs site (matches astro.config `site`). */
const SITE = "https://swagger-to-tanstack-query.vercel.app";

const abs = (path: string) => `${SITE}${path === "/" ? "" : path}`;

/** A localized page: the same content reachable at an en and a ko URL. */
interface Pair {
  en: string;
  ko: string;
  priority: string;
}

function localizedEntry({ en, ko, priority }: Pair): string {
  // Per Google's i18n sitemap guidance, every localized URL lists the full set
  // of alternates (including itself) plus an x-default.
  const alternates = [
    `    <xhtml:link rel="alternate" hreflang="en-US" href="${abs(en)}"/>`,
    `    <xhtml:link rel="alternate" hreflang="ko-KR" href="${abs(ko)}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(en)}"/>`,
  ].join("\n");
  return [en, ko]
    .map(
      (loc) =>
        `  <url>\n    <loc>${abs(loc)}</loc>\n${alternates}\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
    )
    .join("\n");
}

function standaloneEntry(loc: string, priority: string): string {
  return `  <url>\n    <loc>${abs(loc)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export const GET: APIRoute = async () => {
  const docs = await getCollection("docs");
  const slugs = [...new Set(docs.map((d) => slugFromId(d.id)))].sort();

  const pairs: Pair[] = [
    { en: "/", ko: "/ko", priority: "1.0" },
    ...slugs.map((s) => ({ en: `/docs/${s}`, ko: `/ko/docs/${s}`, priority: "0.8" })),
  ];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...pairs.map(localizedEntry),
    standaloneEntry("/playground", "0.7"),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
