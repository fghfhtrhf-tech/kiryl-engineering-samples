export type EmployeeRole = "owner" | "recruiter" | "support" | "analyst";

export type Employee = {
  id: string;
  name: string;
  role: EmployeeRole;
  active: boolean;
};

const ROLE_PERMS: Record<EmployeeRole, Set<string>> = {
  owner: new Set(["apps.read", "apps.write", "chat", "payouts", "stats", "employees"]),
  recruiter: new Set(["apps.read", "apps.write", "chat"]),
  support: new Set(["apps.read", "chat"]),
  analyst: new Set(["apps.read", "stats"])
};

export function can(role: EmployeeRole, perm: string): boolean {
  return ROLE_PERMS[role].has(perm);
}

export class Staff {
  readonly rows = new Map<string, Employee>();

  add(employee: Employee): Employee {
    this.rows.set(employee.id, employee);
    return employee;
  }

  assert(id: string, perm: string): Employee {
    const row = this.rows.get(id);
    if (!row || !row.active) throw new Error("inactive");
    if (!can(row.role, perm)) throw new Error("forbidden");
    return row;
  }
}
