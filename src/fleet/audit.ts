export type AuditActor = { id: string; role: "system" | "operator" | "courier" };

export type AuditEntry = {
  id: number;
  at: Date;
  actor: AuditActor;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
};

export class AuditLog {
  private nextId = 1;
  readonly entries: AuditEntry[] = [];

  record(
    actor: AuditActor,
    action: string,
    entity: string,
    entityId: string,
    before?: unknown,
    after?: unknown
  ): AuditEntry {
    const entry: AuditEntry = {
      id: this.nextId++,
      at: new Date(),
      actor,
      action,
      entity,
      entityId,
      before,
      after
    };
    this.entries.push(entry);
    return entry;
  }

  forEntity(entity: string, entityId: string): AuditEntry[] {
    return this.entries.filter((row) => row.entity === entity && row.entityId === entityId);
  }

  byActor(actorId: string): AuditEntry[] {
    return this.entries.filter((row) => row.actor.id === actorId);
  }
}
