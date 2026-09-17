import { randomBytes } from "node:crypto";

export type BotSession = {
  token: string;
  applicantKey: string;
  expiresAt: Date;
};

export class SessionStore {
  readonly rows = new Map<string, BotSession>();

  create(applicantKey: string, ttlMs = 1000 * 60 * 60 * 12): BotSession {
    const token = randomBytes(16).toString("hex");
    const session = { token, applicantKey, expiresAt: new Date(Date.now() + ttlMs) };
    this.rows.set(token, session);
    return session;
  }

  resolve(token: string, now = new Date()): string | null {
    const session = this.rows.get(token);
    if (!session || session.expiresAt <= now) return null;
    return session.applicantKey;
  }

  revoke(token: string) {
    this.rows.delete(token);
  }
}
