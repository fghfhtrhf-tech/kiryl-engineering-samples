import { allRouteSlugs, type City, type Intent } from "./compose.js";

export type SitemapUrl = { loc: string; changefreq: "daily" | "weekly"; priority: number };

export function buildSitemap(origin: string, cities: City[], intents: Intent[]): SitemapUrl[] {
  const urls: SitemapUrl[] = [{ loc: `${origin}/`, changefreq: "daily", priority: 1 }];
  for (const slug of allRouteSlugs(cities, intents)) {
    const isCity = cities.some((city) => city.slug === slug);
    urls.push({
      loc: `${origin}/join/${slug}`,
      changefreq: isCity ? "daily" : "weekly",
      priority: isCity ? 0.8 : 0.6
    });
  }
  return urls;
}

export function sitemapXml(urls: SitemapUrl[]): string {
  const body = urls
    .map(
      (url) =>
        `<url><loc>${url.loc}</loc><changefreq>${url.changefreq}</changefreq><priority>${url.priority.toFixed(1)}</priority></url>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}
