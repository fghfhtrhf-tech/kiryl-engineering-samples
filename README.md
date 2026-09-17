# Engineering samples — Kiryl Bahdanski

Public, rewritten TypeScript modules that show how I actually ship production
systems. Original product repositories stay private: they contain customer
data, partner contracts, and infrastructure secrets.

These samples are not a dump of private Git history. Each module is a clean
re-implementation of a pattern I used end-to-end as the sole product engineer.

**Stack in production:** TypeScript, Node.js, Fastify/Express, PostgreSQL,
Redis, BullMQ, Socket.IO, SSE, Zod, Telegram Mini Apps, Flutter, Next.js,
GitHub Actions.

## What is in this repo

| Module | Production origin | What to read |
| --- | --- | --- |
| `src/jobs` | Courier onboarding workers | Bounded retries, exponential backoff, dead-letter |
| `src/onboarding` | Registration as a domain workflow | Zod discriminated union, E.164 phones, partner API with retries, walking vs vehicle tracks |
| `src/loyalty` | Bonuses / referrals | Insert-once ledger keyed by `type:subject:period` |
| `src/tenancy` | Multi-tenant dispatch | Platform catalog vs per-tenant stores; JWT tenant must match; members cannot cross tenants |
| `src/dispatch` | Live trip assignment | Expanding search radius, rank by distance then priority then rating, tenant isolation |
| `src/realtime` | Dispatcher + mobile clients | REST keeps durable state; rooms fan out events |
| `src/webhooks` | Provider / payment callbacks | Sorted-JSON HMAC, timing-safe compare, idempotent apply. Browser traffic never credits money |
| `src/auth` | Telegram Mini App | HMAC initData, keep extra signature fields, timing-safe compare |
| `src/sse` | Operator live support | Event-stream payload + nginx `X-Accel-Buffering: no` |
| `src/cache` | Redis around the API | Get/set no-ops when the store is down so the request path stays up |
| `src/seo` | Acquisition site | City × intent composition; demo catalog generates 190+ routes |

## What stays private

Production apps, partner API payloads, customer records, SQL dumps, and
anything involving unlicensed media, cheats, or engagement manipulation are
not here. iGaming engineering is represented only as signed callbacks and
realtime fan-out — no operator licensing, KYC, or revenue claims.

Walkthroughs of the full systems, redacted screens, and architecture diagrams
are on the portfolio site and available in an interview.

## Run

```bash
npm install
npm test
npm run typecheck
```

Node 22+. CI runs the same commands on every push.

## Contact

Kiryl Bahdanski · Minsk · remote / relocation  
fghfhtrhf@gmail.com · Telegram [@kiryxatg](https://t.me/kiryxatg)
