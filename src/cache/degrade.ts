export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

export class MemoryStore implements KeyValueStore {
  private readonly data = new Map<string, { value: string; exp?: number }>();

  async get(key: string) {
    const row = this.data.get(key);
    if (!row) return null;
    if (row.exp && row.exp < Date.now()) {
      this.data.delete(key);
      return null;
    }
    return row.value;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    this.data.set(key, { value, exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined });
  }

  async del(key: string) {
    this.data.delete(key);
  }
}

/** Cache that degrades to no-ops when the store is down — request path stays up. */
export class Cache {
  constructor(private readonly store: KeyValueStore | null) {}

  async get(key: string): Promise<string | null> {
    if (!this.store) return null;
    try {
      return await this.store.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.store) return;
    try {
      await this.store.set(key, value, ttlSeconds);
    } catch {
      /* degrade */
    }
  }
}
