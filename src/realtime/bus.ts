type Handler = (event: string, payload: unknown) => void;

/** REST writes durable state. This bus is the fan-out path (Socket.IO rooms in production). */
export class RealtimeBus {
  private readonly rooms = new Map<string, Set<Handler>>();

  join(room: string, handler: Handler): () => void {
    const set = this.rooms.get(room) ?? new Set<Handler>();
    set.add(handler);
    this.rooms.set(room, set);
    return () => set.delete(handler);
  }

  emit(room: string, event: string, payload: unknown): void {
    for (const handler of this.rooms.get(room) ?? []) handler(event, payload);
  }
}

export function userRoom(userId: string) {
  return `user:${userId}`;
}

export function tenantRoom(tenantId: string) {
  return `tenant:${tenantId}`;
}
