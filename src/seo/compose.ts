export type City = { slug: string; name: string; prep: string };
export type Intent = { slug: string; label: string };

export function allRouteSlugs(cities: City[], intents: Intent[]): string[] {
  const slugs: string[] = [];
  for (const city of cities) {
    slugs.push(city.slug);
    for (const intent of intents) slugs.push(`${city.slug}-${intent.slug}`);
  }
  return slugs;
}

export function composeRoute(slug: string, cities: City[], intents: Intent[]) {
  const city = cities.find((item) => item.slug === slug);
  if (city) {
    return { path: `/join/${city.slug}`, title: `Work in ${city.name}`, city, intent: null };
  }
  for (const intent of intents) {
    const suffix = `-${intent.slug}`;
    if (!slug.endsWith(suffix)) continue;
    const citySlug = slug.slice(0, -suffix.length);
    const match = cities.find((item) => item.slug === citySlug);
    if (match) {
      return {
        path: `/join/${slug}`,
        title: `${intent.label} in ${match.name}`,
        city: match,
        intent
      };
    }
  }
  return null;
}

export function demoCatalog(): { cities: City[]; intents: Intent[] } {
  const cities: City[] = Array.from({ length: 16 }, (_, i) => ({
    slug: `city-${i + 1}`,
    name: `City ${i + 1}`,
    prep: `in City ${i + 1}`
  }));
  const intents: Intent[] = [
    { slug: "courier", label: "Courier" },
    { slug: "auto", label: "Vehicle" },
    { slug: "cargo", label: "Cargo" },
    { slug: "night", label: "Night" },
    { slug: "weekend", label: "Weekend" },
    { slug: "part-time", label: "Part-time" },
    { slug: "full-time", label: "Full-time" },
    { slug: "start-today", label: "Start today" },
    { slug: "no-office", label: "No office" },
    { slug: "telegram", label: "Telegram onboarding" },
    { slug: "referral", label: "Referral" },
    { slug: "loyalty", label: "Loyalty" }
  ];
  return { cities, intents };
}
