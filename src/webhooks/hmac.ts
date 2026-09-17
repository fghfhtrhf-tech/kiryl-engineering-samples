import { createHmac, timingSafeEqual } from "node:crypto";

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
      sorted[key] = sortValue((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

export function canonicalJson(body: unknown): string {
  return JSON.stringify(sortValue(body));
}

export function signSortedHmac(body: unknown, secret: string, algo: "sha512" | "sha256" = "sha512"): string {
  return createHmac(algo, secret).update(canonicalJson(body)).digest("hex");
}

export function verifySortedHmac(
  body: unknown,
  signature: string,
  secret: string,
  algo: "sha512" | "sha256" = "sha512"
): boolean {
  const expected = signSortedHmac(body, secret, algo);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
