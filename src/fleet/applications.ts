export type ApplicationStatus = "pending" | "processing" | "created" | "error";

export type Application = {
  id: string;
  applicantKey: string;
  payload: unknown;
  status: ApplicationStatus;
  errorMessage?: string;
  partnerDriverId?: string;
  partnerVehicleId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

let seq = 1;

export class ApplicationStore {
  readonly rows = new Map<string, Application>();

  create(applicantKey: string, payload: unknown): Application {
    const id = `app_${seq++}`;
    const now = new Date();
    const row: Application = {
      id,
      applicantKey,
      payload,
      status: "pending",
      createdAt: now,
      updatedAt: now
    };
    this.rows.set(id, row);
    return row;
  }

  markProcessing(id: string): Application {
    return this.patch(id, { status: "processing" });
  }

  markCreated(id: string, partnerDriverId: string, partnerVehicleId: string | null): Application {
    return this.patch(id, { status: "created", partnerDriverId, partnerVehicleId, errorMessage: undefined });
  }

  markError(id: string, errorMessage: string): Application {
    return this.patch(id, { status: "error", errorMessage });
  }

  byApplicant(applicantKey: string): Application[] {
    return [...this.rows.values()]
      .filter((row) => row.applicantKey === applicantKey)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  latest(applicantKey: string): Application | undefined {
    return this.byApplicant(applicantKey)[0];
  }

  private patch(id: string, fields: Partial<Application>): Application {
    const row = this.rows.get(id);
    if (!row) throw new Error(`Application ${id} not found`);
    Object.assign(row, fields, { updatedAt: new Date() });
    return row;
  }
}
