export type TenantPool = { tenantId: string; name: string; dsn: string; active: boolean };

export class PoolRouter {
  constructor(
    readonly platform: { name: string; dsn: string },
    readonly tenants: Map<string, TenantPool>
  ) {}

  platformDsn(): string {
    return this.platform.dsn;
  }

  tenantDsn(tenantId: string): string {
    const row = this.tenants.get(tenantId);
    if (!row || !row.active) throw new Error("tenant_unavailable");
    return row.dsn;
  }

  deactivate(tenantId: string) {
    const row = this.tenants.get(tenantId);
    if (row) row.active = false;
  }
}
