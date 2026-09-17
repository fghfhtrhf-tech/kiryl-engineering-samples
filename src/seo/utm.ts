export type Utm = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
};

export function parseUtm(search: string): Utm {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    source: params.get("utm_source") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: params.get("utm_campaign") ?? undefined,
    content: params.get("utm_content") ?? undefined,
    term: params.get("utm_term") ?? undefined
  };
}

export function utmKey(utm: Utm): string {
  return [utm.source ?? "-", utm.medium ?? "-", utm.campaign ?? "-"].join(":");
}

export function firstTouch(existing: Utm | undefined, incoming: Utm): Utm {
  if (!existing?.source) return incoming;
  return existing;
}
