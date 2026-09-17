export type Role = "member" | "platform_admin";

export type Caller = {
  userId: string;
  tenantId: string;
  role: Role;
};

export class TenantError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

/** Platform catalog + per-tenant pools. Operational queries never run without a tenant id. */
export class TenantRouter<TStore extends object> {
  constructor(
    private readonly platform: TStore,
    private readonly tenants: Map<string, TStore>
  ) {}

  platformStore(): TStore {
    return this.platform;
  }

  store(tenantId: string): TStore {
    const store = this.tenants.get(tenantId);
    if (!store) throw new TenantError(`Unknown tenant ${tenantId}`, 404);
    return store;
  }
}

export function tenantGuard(caller: Caller, requestedTenantId: string): string {
  if (caller.role === "platform_admin") return requestedTenantId;
  if (caller.tenantId !== requestedTenantId) {
    throw new TenantError("Access denied: tenant mismatch", 403);
  }
  return requestedTenantId;
}

export function assertTokenMatchesRecord(tokenTenantId: string, recordTenantId: string): void {
  if (tokenTenantId !== recordTenantId) {
    throw new TenantError("Token tenant mismatch — re-authenticate", 401);
  }
}
