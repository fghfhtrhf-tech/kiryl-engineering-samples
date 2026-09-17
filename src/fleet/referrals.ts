import { Ledger } from "../loyalty/ledger.js";
import { periodKeyMonth } from "./cashWindows.js";

export const REFERRAL_FIRST = 30;
export const REFERRAL_RECURRING = 10;
export const REFERRAL_UNLOCK_CASH = 200;
export const MAX_REFERRAL_DEPTH = 1;

export type ReferralEdge = {
  referrerId: string;
  refereeId: string;
  createdAt: Date;
};

export class ReferralGraph {
  readonly edges: ReferralEdge[] = [];
  private readonly byReferee = new Map<string, string>();

  link(referrerId: string, refereeId: string, now = new Date()): ReferralEdge {
    if (referrerId === refereeId) throw new Error("self_referral");
    if (this.byReferee.has(refereeId)) throw new Error("already_referred");
    const reverse = this.byReferee.get(referrerId);
    if (reverse === refereeId) throw new Error("cycle");
    const edge: ReferralEdge = { referrerId, refereeId, createdAt: now };
    this.edges.push(edge);
    this.byReferee.set(refereeId, referrerId);
    return edge;
  }

  referrerOf(refereeId: string): string | undefined {
    return this.byReferee.get(refereeId);
  }

  team(referrerId: string): string[] {
    return this.edges.filter((edge) => edge.referrerId === referrerId).map((edge) => edge.refereeId);
  }

  applyCash(
    ledger: Ledger,
    refereeId: string,
    cashMonth: number,
    now = new Date()
  ): { first: boolean; recurring: boolean } {
    const referrerId = this.referrerOf(refereeId);
    if (!referrerId || cashMonth < REFERRAL_UNLOCK_CASH) {
      return { first: false, recurring: false };
    }
    const month = periodKeyMonth(now);
    const first = ledger.enqueue("referral_first", referrerId, `${refereeId}:${month}`, REFERRAL_FIRST);
    const recurring = ledger.enqueue("referral_recurring", referrerId, `${refereeId}:${month}`, REFERRAL_RECURRING);
    return { first, recurring };
  }
}
