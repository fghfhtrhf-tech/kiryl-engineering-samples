export const LOCALES = [
  "en",
  "ru",
  "de",
  "fr",
  "es",
  "pt",
  "tr",
  "ar",
  "hi",
  "bn",
  "id",
  "vi",
  "th",
  "zh",
  "ja",
  "ko",
  "uk",
  "pl",
  "ro",
  "hu",
  "cs",
  "el",
  "it",
  "nl",
  "sv",
  "fi",
  "az",
  "kk",
  "uz",
  "fa",
  "he",
  "sr",
  "hr"
] as const;

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function pickLocale(header: string | undefined, fallback: Locale = "en"): Locale {
  if (!header) return fallback;
  const first = header.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  return first && isLocale(first) ? first : fallback;
}
