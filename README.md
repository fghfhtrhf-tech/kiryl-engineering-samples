# Engineering samples — Kiryl Bahdanski

Public, rewritten TypeScript modules that show how I actually ship production
systems. This is the only public code repository. The cinematic portfolio is
at [fghfhtrhf-tech.github.io/kiryl-engineering-samples](https://fghfhtrhf-tech.github.io/kiryl-engineering-samples/).

Original product repositories stay private: they contain customer
data, partner contracts, infrastructure secrets, and years of operational
history.

These samples are **not** a dump of private Git history and they are **not**
the full production surface. Production codebases here are large, multi-app
systems. What employers can read in this repo is a sanitized, compilable
slice of the same domains: onboarding, tenancy, dispatch, realtime, signed
money movement, acquisition, and operations.

**Stack in production:** TypeScript, Node.js, Fastify/Express, PostgreSQL,
Redis, BullMQ, Socket.IO, SSE, Zod, Telegram Mini Apps, Flutter, Next.js,
GitHub Actions.

## Size of this public slice

Counted from `src/`, `sql/`, and `tests/` (no `node_modules`):

| Area | Approx. lines | Production origin |
| --- | ---: | --- |
| Fleet / courier ops (`src/fleet`, onboarding, jobs, loyalty, SSE, SEO, stats, auth, cache) | ~1,700 | Courier onboarding bot, Mini App, CRM, acquisition site, analytics |
| Multi-tenant dispatch (`src/dispatch`, tenancy, realtime) | ~900 | Taxi dispatch platform: assignment, ratings, live location, billing |
| Wallet / signed callbacks (`src/wallet`, webhooks) | ~600 | iGaming engineering: HMAC IPN, bonus ladder, wager, withdrawals. No licensing/KYC/revenue claims |
| Media pipeline (`src/media`) | ~110 | Legal HLS / transcode job sample (not the original media product) |
| Shared ops | ~130 | Env, health, retries, pagination, structured errors |
| SQL schemas | ~380 | Synthetic tables that match the TypeScript domains |
| Tests | ~830 | 49 tests covering the modules above |
| **Public total** | **~4,700** | Rewritten samples, MIT |

Private production systems behind this are much larger (three connected fleet
apps, a multi-tenant dispatch stack with mobile clients, an iGaming platform
with 30+ schema migrations). That code stays private on purpose.

## What is in this repo

| Module | Production origin | What to read |
| --- | --- | --- |
| `src/jobs` | Courier onboarding workers | Bounded retries, exponential backoff, dead-letter |
| `src/onboarding` | Registration as a domain workflow | Zod discriminated union, E.164 phones, partner API with retries, walking vs vehicle tracks |
| `src/fleet` | Bot, CRM, loyalty, cash, payouts, chat | Minsk cash windows, insert-once payouts, document packs, SSE-style support chat, staff RBAC |
| `src/loyalty` | Bonuses / referrals | Insert-once ledger keyed by `type:subject:period` |
| `src/tenancy` | Multi-tenant dispatch | Platform catalog vs per-tenant stores/pools; JWT tenant must match |
| `src/dispatch` | Live trip assignment | Expanding radius, fare estimate, rating window 150, priority cap 93, live location, rate limits |
| `src/realtime` | Dispatcher + mobile clients | REST keeps durable state; rooms fan out events |
| `src/webhooks` | Provider / payment callbacks | Sorted-JSON HMAC, timing-safe compare, idempotent apply |
| `src/wallet` | Signed deposits / bonuses / wager | Bonus ladder 100–150%, wager x40, withdrawals blocked while bonus is active |
| `src/auth` | Telegram Mini App | HMAC initData, timing-safe compare |
| `src/sse` | Operator live support | Event-stream payload + nginx `X-Accel-Buffering: no` |
| `src/cache` | Redis around the API | Get/set no-ops when the store is down |
| `src/seo` | Acquisition site | City × intent composition; production-like catalog is 350+ routes |
| `src/stats` | Funnel / KPI reports | Conversion, drop-off, hourly fill, cohorts |
| `src/media` | VOD pipeline | Probe → ladder → HLS playlists → transcode job state |
| `src/ops` | Production hardening | Zod env, health pings, retries, pagination |
| `sql/` | Schema sketches | Synthetic PostgreSQL for the domains above |

## What stays private

Production apps, partner API payloads, customer records, SQL dumps, and
anything involving unlicensed media, cheats, or engagement manipulation are
not here. iGaming engineering is represented only as signed callbacks,
bonuses, wager, and realtime rooms — no operator licensing, KYC, or revenue
claims.

Walkthroughs of the full systems, redacted screens, and architecture diagrams
are on the portfolio site and available in an interview.

## Run

```bash
npm install
npm test
npm run typecheck
```

Node 22+. CI runs the same commands on every push. 49 tests at last publish.

## Contact

Kiryl Bahdanski · Minsk · remote / relocation  
fghfhtrhf@gmail.com · Telegram [@kiryxatg](https://t.me/kiryxatg)  
Site: [fghfhtrhf-tech.github.io/kiryl-engineering-samples](https://fghfhtrhf-tech.github.io/kiryl-engineering-samples/)
