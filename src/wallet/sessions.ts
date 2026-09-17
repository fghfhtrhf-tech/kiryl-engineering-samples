import { randomBytes } from "node:crypto";

export type WalletSession = {
  id: string;
  userId: string;
  locale: string;
  expiresAt: Date;
};

export class WalletSessionStore {
  readonly rows = new Map<string, WalletSession>();

  create(userId: string, locale: string, ttlMs = 1000 * 60 * 60 * 24 * 7): WalletSession {
    const session: WalletSession = {
      id: randomBytes(24).toString("hex"),
      userId,
      locale,
      expiresAt: new Date(Date.now() + ttlMs)
    };
    this.rows.set(session.id, session);
    return session;
  }

  resolve(id: string, now = new Date()): WalletSession | null {
    const row = this.rows.get(id);
    if (!row || row.expiresAt <= now) return null;
    return row;
  }

  revokeUser(userId: string) {
    for (const [id, row] of this.rows) {
      if (row.userId === userId) this.rows.delete(id);
    }
  }
}
