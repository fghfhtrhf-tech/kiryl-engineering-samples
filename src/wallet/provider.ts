import { createHmac, timingSafeEqual } from "node:crypto";

export type ProviderSession = {
  userId: string;
  gameId: string;
  currency: string;
  token: string;
  exp: number;
};

export function issueProviderToken(
  userId: string,
  gameId: string,
  currency: string,
  secret: string,
  ttlSec = 600
): ProviderSession {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `${userId}.${gameId}.${currency}.${exp}`;
  const token = `${payload}.${createHmac("sha256", secret).update(payload).digest("hex")}`;
  return { userId, gameId, currency, token, exp };
}

export function verifyProviderToken(token: string, secret: string): ProviderSession {
  const parts = token.split(".");
  if (parts.length !== 5) throw new Error("malformed");
  const [userId, gameId, currency, expRaw, sig] = parts;
  const payload = `${userId}.${gameId}.${currency}.${expRaw}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("bad_signature");
  const exp = Number(expRaw);
  if (exp * 1000 < Date.now()) throw new Error("expired");
  return { userId, gameId, currency, token, exp };
}
