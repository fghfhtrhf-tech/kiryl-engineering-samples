export type LeadStatus = "new" | "contacted" | "qualified" | "lost" | "won";

export type Lead = {
  id: string;
  source: string;
  phone?: string;
  applicantKey?: string;
  status: LeadStatus;
  createdAt: Date;
};

let seq = 1;

export class LeadBoard {
  readonly rows = new Map<string, Lead>();

  capture(source: string, phone?: string, applicantKey?: string): Lead {
    const lead: Lead = {
      id: `ld_${seq++}`,
      source,
      phone,
      applicantKey,
      status: "new",
      createdAt: new Date()
    };
    this.rows.set(lead.id, lead);
    return lead;
  }

  setStatus(id: string, status: LeadStatus): Lead {
    const row = this.rows.get(id);
    if (!row) throw new Error("lead_not_found");
    row.status = status;
    return row;
  }

  attachApplicant(id: string, applicantKey: string): Lead {
    const row = this.setStatus(id, "qualified");
    row.applicantKey = applicantKey;
    return row;
  }

  bySource(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const row of this.rows.values()) out[row.source] = (out[row.source] ?? 0) + 1;
    return out;
  }
}
