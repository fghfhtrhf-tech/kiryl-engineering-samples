import type { City, Intent } from "./compose.js";

/** Synthetic city catalog for programmatic acquisition pages. */
export const CITIES: City[] = [
  { slug: "minsk", name: "Minsk", prep: "in Minsk" },
  { slug: "brest", name: "Brest", prep: "in Brest" },
  { slug: "grodno", name: "Grodno", prep: "in Grodno" },
  { slug: "gomel", name: "Gomel", prep: "in Gomel" },
  { slug: "mogilev", name: "Mogilev", prep: "in Mogilev" },
  { slug: "vitebsk", name: "Vitebsk", prep: "in Vitebsk" },
  { slug: "baranovichi", name: "Baranovichi", prep: "in Baranovichi" },
  { slug: "borisov", name: "Borisov", prep: "in Borisov" },
  { slug: "pinsk", name: "Pinsk", prep: "in Pinsk" },
  { slug: "orsha", name: "Orsha", prep: "in Orsha" },
  { slug: "mozyr", name: "Mozyr", prep: "in Mozyr" },
  { slug: "soligorsk", name: "Soligorsk", prep: "in Soligorsk" },
  { slug: "lida", name: "Lida", prep: "in Lida" },
  { slug: "novopolotsk", name: "Novopolotsk", prep: "in Novopolotsk" },
  { slug: "molodechno", name: "Molodechno", prep: "in Molodechno" },
  { slug: "polotsk", name: "Polotsk", prep: "in Polotsk" },
  { slug: "zhlobin", name: "Zhlobin", prep: "in Zhlobin" },
  { slug: "svetlogorsk", name: "Svetlogorsk", prep: "in Svetlogorsk" },
  { slug: "rechitsa", name: "Rechitsa", prep: "in Rechitsa" },
  { slug: "slutsk", name: "Slutsk", prep: "in Slutsk" },
  { slug: "zhodino", name: "Zhodino", prep: "in Zhodino" },
  { slug: "kobrin", name: "Kobrin", prep: "in Kobrin" },
  { slug: "slutsk-region", name: "Slutsk region", prep: "in the Slutsk region" },
  { slug: "smorgon", name: "Smorgon", prep: "in Smorgon" }
];

export const INTENTS: Intent[] = [
  { slug: "courier", label: "Courier" },
  { slug: "auto", label: "Vehicle" },
  { slug: "cargo", label: "Cargo" },
  { slug: "walking", label: "Walking" },
  { slug: "night", label: "Night" },
  { slug: "weekend", label: "Weekend" },
  { slug: "part-time", label: "Part-time" },
  { slug: "full-time", label: "Full-time" },
  { slug: "start-today", label: "Start today" },
  { slug: "no-office", label: "No office" },
  { slug: "telegram", label: "Telegram onboarding" },
  { slug: "referral", label: "Referral" },
  { slug: "loyalty", label: "Loyalty" },
  { slug: "students", label: "Students" },
  { slug: "evenings", label: "Evenings" }
];

export function productionLikeCatalog(): { cities: City[]; intents: Intent[] } {
  return { cities: CITIES, intents: INTENTS };
}
