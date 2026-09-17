import { createHmac, timingSafeEqual } from "node:crypto";

export function normalizeInitData(raw: string): string {
  let value = raw.trim();
  for (let i = 0; i < 3; i++) {
    if (!/%3D|%26|%7B/i.test(value)) break;
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }
  return value;
}

/** HMAC check for Mini App / WebApp init payloads. `hash` is excluded; other fields stay. */
export function validateWebAppInitData(initDataRaw: string, botToken: string): boolean {
  const initData = normalizeInitData(initDataRaw);
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculated = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  try {
    const a = Buffer.from(calculated, "hex");
    const b = Buffer.from(hash, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
