export type CompanyStatus = "trial" | "active" | "past_due" | "blocked";

export type Company = {
  id: string;
  name: string;
  status: CompanyStatus;
  dbKey: string;
  createdAt: Date;
};

export class CompanyCatalog {
  readonly rows = new Map<string, Company>();

  create(name: string, dbKey: string): Company {
    const id = `co_${this.rows.size + 1}`;
    const company: Company = { id, name, status: "trial", dbKey, createdAt: new Date() };
    this.rows.set(id, company);
    return company;
  }

  setStatus(id: string, status: CompanyStatus): Company {
    const row = this.must(id);
    row.status = status;
    return row;
  }

  canAcceptTraffic(id: string): boolean {
    const row = this.rows.get(id);
    return Boolean(row && (row.status === "active" || row.status === "trial"));
  }

  private must(id: string): Company {
    const row = this.rows.get(id);
    if (!row) throw new Error("company_not_found");
    return row;
  }
}
