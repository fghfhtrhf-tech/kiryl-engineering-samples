export type CatalogHit = { ok: true; brand: string; model: string } | { ok: false; message: string };

const CATALOG: Record<string, string[]> = {
  volkswagen: ["polo", "golf", "passat", "transporter", "tiguan", "jetta", "caddy", "touran"],
  toyota: ["corolla", "camry", "hilux", "rav4", "yaris", "avensis", "landcruiser", "prius"],
  hyundai: ["solaris", "elantra", "tucson", "creta", "santafe", "i30", "accent"],
  kia: ["rio", "ceed", "sportage", "sorento", "cerato", "optima", "picanto"],
  geely: ["coolray", "atlas", "emgrand", "tugella", "okavango"],
  lada: ["granta", "vesta", "largus", "niva", "xray"],
  skoda: ["octavia", "rapid", "fabia", "kodiaq", "karoq", "superb"],
  renault: ["logan", "sandero", "duster", "megane", "kangoo", "fluence"],
  nissan: ["almera", "qashqai", "xtrail", "juke", "note", "tiida"],
  ford: ["focus", "fiesta", "mondeo", "kuga", "transit", "fusion"],
  mazda: ["mazda3", "mazda6", "cx5", "cx3", "cx30"],
  bmw: ["3series", "5series", "x1", "x3", "x5"],
  mercedes: ["cclass", "eclass", "aclass", "glb", "vito"],
  audi: ["a3", "a4", "a6", "q3", "q5"],
  chevrolet: ["cruze", "aveo", "lando", "captiva", "niva"],
  peugeot: ["308", "301", "3008", "partner", "208"],
  citroen: ["c4", "c3", "berlingo", "celysee"],
  opel: ["astra", "corsa", "insignia", "mokka", "zafira"],
  honda: ["civic", "accord", "crv", "fit", "jazz"],
  mitsubishi: ["lancer", "outlander", "asx", "pajero"],
  subaru: ["impreza", "forester", "outback", "xv"],
  suzuki: ["swift", "vitara", "sx4", "jimny"],
  volvo: ["s60", "s80", "xc60", "xc90", "v40"],
  chery: ["tiggo", "arrizo", "bonus"],
  haval: ["h6", "jolion", "dargo", "f7"],
  changan: ["cs35", "cs55", "uni"],
  byd: ["song", "yuan", "qin"],
  tesla: ["model3", "modely"],
  gaz: ["gazelle", "sobol", "next"],
  uaz: ["patriot", "hunter", "bukhanka"]
};

const ALIASES: Record<string, string> = {
  vw: "volkswagen",
  mercedesbenz: "mercedes",
  mb: "mercedes",
  ladaauto: "lada",
  vaz: "lada",
  chevy: "chevrolet",
  citroen: "citroen"
};

function fold(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9]+/g, "");
}

export function resolveBrand(brand: string): string | undefined {
  const folded = fold(brand);
  if (ALIASES[folded]) return ALIASES[folded];
  return Object.keys(CATALOG).find((key) => fold(key) === folded || folded.includes(fold(key)));
}

export function resolveBrandModel(brand: string, model: string): CatalogHit {
  const brandKey = resolveBrand(brand);
  if (!brandKey) return { ok: false, message: "Unknown vehicle brand" };
  const models = CATALOG[brandKey];
  const modelKey = models.find((item) => fold(item) === fold(model) || fold(model).includes(fold(item)));
  if (!modelKey) return { ok: false, message: `Unknown ${brandKey} model` };
  return { ok: true, brand: brandKey, model: modelKey };
}

export function listBrands(): string[] {
  return Object.keys(CATALOG);
}

export function listModels(brand: string): string[] {
  const key = resolveBrand(brand);
  return key ? CATALOG[key] : [];
}

export function catalogSize(): { brands: number; models: number } {
  return {
    brands: Object.keys(CATALOG).length,
    models: Object.values(CATALOG).reduce((sum, models) => sum + models.length, 0)
  };
}
