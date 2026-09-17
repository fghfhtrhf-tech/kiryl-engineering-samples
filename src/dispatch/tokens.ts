import { createHmac, timingSafeEqual } from "node:crypto";

export type AccessToken = {
  userId: string;
  tenantId: string;
  role: "member" | "platform_admin";
  exp: number;
};

function encode(data: object): string {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function issueToken(claims: Omit<AccessToken, "exp">, secret: string, ttlSec = 3600): string {
  const payload = encode({ ...claims, exp: Math.floor(Date.now() / 1000) + ttlSec });
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyToken(token: string, secret: string): AccessToken {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) throw new Error("malformed_token");
  const expected = sign(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("bad_signature");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as AccessToken;
  if (claims.exp * 1000 < Date.now()) throw new Error("expired");
  return claims;
}
