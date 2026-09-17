export class PartnerError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean
  ) {
    super(message);
  }
}

export type PartnerDriver = { id: string; vehicleId: string | null };

export interface PartnerClient {
  createWalkingProfile(input: { fullName: string; phone: string }): Promise<PartnerDriver>;
  createVehicle(input: { plate: string; year: number; vin?: string }): Promise<{ id: string }>;
  createDriverProfile(input: { fullName: string; phone: string; vehicleId: string }): Promise<PartnerDriver>;
  bindVehicle(driverId: string, vehicleId: string): Promise<void>;
}

export async function withRetries<T>(
  run: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await run();
    } catch (error) {
      last = error;
      const retryable = error instanceof PartnerError ? error.retryable : true;
      if (!retryable || attempt === attempts) throw error;
    }
  }
  throw last;
}
