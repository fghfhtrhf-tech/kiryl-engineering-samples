import { composeRoute, type City, type Intent } from "./compose.js";

export type PageMeta = {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
};

export function pageMeta(slug: string, origin: string, cities: City[], intents: Intent[]): PageMeta | null {
  const page = composeRoute(slug, cities, intents);
  if (!page) return null;
  const description = page.intent
    ? `${page.intent.label} work ${page.city.prep}. Register in Telegram, documents in the Mini App.`
    : `Courier work ${page.city.prep}. Walking and vehicle tracks. Telegram onboarding.`;
  return {
    title: page.title,
    description,
    canonical: `${origin}${page.path}`,
    ogTitle: page.title
  };
}
