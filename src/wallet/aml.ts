/** Volume flags only. This is not a KYC or licensing implementation. */

export type VolumeFlag = {
  userId: string;
  windowHours: number;
  deposited: number;
  withdrawn: number;
  reason: "velocity" | "withdraw_gt_deposit" | "round_trip";
};

const VELOCITY_USD = 5_000;
const ROUND_TRIP_MINUTES = 30;

export function flagVelocity(userId: string, deposited24h: number): VolumeFlag | null {
  if (deposited24h < VELOCITY_USD) return null;
  return { userId, windowHours: 24, deposited: deposited24h, withdrawn: 0, reason: "velocity" };
}

export function flagWithdrawGtDeposit(userId: string, deposited: number, withdrawn: number): VolumeFlag | null {
  if (withdrawn <= deposited) return null;
  return { userId, windowHours: 24, deposited, withdrawn, reason: "withdraw_gt_deposit" };
}

export function flagRoundTrip(
  userId: string,
  depositAt: Date,
  withdrawAt: Date,
  amount: number
): VolumeFlag | null {
  const deltaMin = (withdrawAt.getTime() - depositAt.getTime()) / 60_000;
  if (deltaMin > ROUND_TRIP_MINUTES || amount < 200) return null;
  return { userId, windowHours: 1, deposited: amount, withdrawn: amount, reason: "round_trip" };
}
