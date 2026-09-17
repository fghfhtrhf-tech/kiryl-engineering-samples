export type WalletReferral = { code: string; ownerId: string; invited: string[] };

export class WalletReferralBook {
  readonly byCode = new Map<string, WalletReferral>();
  readonly byUser = new Map<string, string>();

  issue(ownerId: string, code: string): WalletReferral {
    const row: WalletReferral = { code: code.toLowerCase(), ownerId, invited: [] };
    this.byCode.set(row.code, row);
    return row;
  }

  redeem(code: string, userId: string): string {
    const row = this.byCode.get(code.toLowerCase());
    if (!row) throw new Error("bad_code");
    if (row.ownerId === userId) throw new Error("self");
    if (this.byUser.has(userId)) throw new Error("already");
    row.invited.push(userId);
    this.byUser.set(userId, row.ownerId);
    return row.ownerId;
  }

  reward(ownerId: string, depositUsd: number): number {
    if (depositUsd < 20) return 0;
    return Number((depositUsd * 0.1).toFixed(2));
  }
}
