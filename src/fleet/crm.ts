import type { Application, ApplicationStore } from "./applications.js";

export type CrmFilters = {
  status?: Application["status"];
  query?: string;
};

export function listApplications(store: ApplicationStore, filters: CrmFilters = {}): Application[] {
  let rows = [...store.rows.values()];
  if (filters.status) rows = rows.filter((row) => row.status === filters.status);
  if (filters.query) {
    const q = filters.query.toLowerCase();
    rows = rows.filter((row) => JSON.stringify(row.payload).toLowerCase().includes(q) || row.applicantKey.includes(q));
  }
  return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function funnelFromApplications(store: ApplicationStore): Record<string, number> {
  const counts: Record<string, number> = { pending: 0, processing: 0, created: 0, error: 0 };
  for (const row of store.rows.values()) counts[row.status] += 1;
  return counts;
}

export function bulkDropErrors(store: ApplicationStore): number {
  let removed = 0;
  for (const [id, row] of store.rows) {
    if (row.status === "error") {
      store.rows.delete(id);
      removed += 1;
    }
  }
  return removed;
}
