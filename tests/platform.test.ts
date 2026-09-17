import assert from "node:assert/strict";
import { test } from "node:test";
import { allRouteSlugs } from "../src/seo/compose.js";
import { productionLikeCatalog } from "../src/seo/cities.js";
import { buildSitemap, sitemapXml } from "../src/seo/sitemap.js";
import { firstTouch, parseUtm, utmKey } from "../src/seo/utm.js";
import { pageMeta } from "../src/seo/metadata.js";
import { conversionRate, dropOff, kpis } from "../src/stats/kpis.js";
import { bucketHour, fillGaps, movingAverage } from "../src/stats/timeseries.js";
import { dailyReport } from "../src/stats/reports.js";
import { averageRetention } from "../src/stats/cohorts.js";
import { loadEnv } from "../src/ops/env.js";
import { AppError, toHttp } from "../src/ops/errors.js";
import { overall, ping } from "../src/ops/health.js";
import { parsePage, slicePage } from "../src/ops/pagination.js";
import { withRetry } from "../src/ops/retry.js";
import { Logger } from "../src/ops/logger.js";
import { ladderFor, parseProbe } from "../src/media/probe.js";
import { masterPlaylist, mediaPlaylist } from "../src/media/hls.js";
import { TranscodeQueue } from "../src/media/jobs.js";

test("production-like city catalog exceeds 350 routes and builds sitemap", () => {
  const { cities, intents } = productionLikeCatalog();
  const slugs = allRouteSlugs(cities, intents);
  assert.ok(slugs.length > 350);
  const urls = buildSitemap("https://example.test", cities, intents);
  assert.ok(urls.length > 350);
  assert.match(sitemapXml(urls), /urlset/);
  const meta = pageMeta("minsk-courier", "https://example.test", cities, intents);
  assert.equal(meta?.title, "Courier in Minsk");
});

test("utm first-touch is sticky", () => {
  const incoming = parseUtm("utm_source=tg&utm_medium=bot&utm_campaign=spring");
  assert.equal(utmKey(incoming), "tg:bot:spring");
  const keep = firstTouch(incoming, parseUtm("utm_source=other"));
  assert.equal(keep.source, "tg");
});

test("stats kpis timeseries reports cohorts", () => {
  assert.equal(conversionRate({ visit: 100, start: 40 }, "visit", "start"), 0.4);
  assert.equal(dropOff({ a: 10, b: 4 }, ["a", "b"])[0].lost, 6);
  const metrics = kpis({ visits: 100, starts: 40, created: 10, errors: 2, payouts: 50 });
  assert.equal(metrics.startToCreated, 0.25);
  const hours = bucketHour([
    { at: new Date("2026-09-01T01:10:00Z"), value: 2 },
    { at: new Date("2026-09-01T01:50:00Z"), value: 3 }
  ]);
  assert.equal(hours.get("2026-09-01T01"), 5);
  const filled = fillGaps(hours, new Date("2026-09-01T00:00:00Z"), new Date("2026-09-01T02:00:00Z"));
  assert.equal(filled.length, 3);
  assert.deepEqual(movingAverage([1, 2, 3], 2), [1, 1.5, 2.5]);
  const report = dailyReport("2026-09-01", [
    { at: new Date("2026-09-01T01:00:00Z"), event: "visit" },
    { at: new Date("2026-09-01T01:01:00Z"), event: "start" },
    { at: new Date("2026-09-01T01:02:00Z"), event: "created" }
  ]);
  assert.equal(report.starts, 1);
  assert.equal(
    averageRetention(
      [
        { started: new Date(), size: 10, retained: [10, 5] },
        { started: new Date(), size: 10, retained: [10, 7] }
      ],
      1
    ),
    0.6
  );
});

test("ops env errors health pagination retry logger", async () => {
  const env = loadEnv({
    NODE_ENV: "test",
    DATABASE_URL: "postgres://local/app",
    HMAC_SECRET: "sixteen-chars-min",
    PUBLIC_ORIGIN: "https://example.test"
  } as NodeJS.ProcessEnv);
  assert.equal(env.PORT, 8080);
  const http = toHttp(new AppError("nope", "broken", 409));
  assert.equal(http.status, 409);
  const health = overall([await ping("db", async () => undefined)]);
  assert.equal(health.ok, true);
  const page = slicePage([1, 2, 3, 4, 5], parsePage({ page: "2", pageSize: "2" }));
  assert.deepEqual(page.items, [3, 4]);
  let hits = 0;
  const value = await withRetry(async () => {
    hits += 1;
    if (hits < 3) throw new Error("flaky");
    return 7;
  }, 3, 1);
  assert.equal(value, 7);
  const log = new Logger("warn");
  log.info("skip");
  log.error("keep");
  assert.equal(log.lines.length, 1);
});

test("media probe ladder hls jobs", () => {
  const probe = parseProbe({
    format: { duration: "12.5" },
    streams: [
      { codec_type: "video", codec_name: "h264", width: 1920, height: 1080, avg_frame_rate: "30/1" },
      { codec_type: "audio", codec_name: "aac" }
    ]
  });
  assert.equal(ladderFor(probe).length, 4);
  assert.match(masterPlaylist(probe, "/vod/1"), /1080p/);
  assert.match(mediaPlaylist(4, 3, "/vod/1/720p"), /ENDLIST/);
  const queue = new TranscodeQueue();
  const job = queue.enqueue("inbox/clip.mp4");
  queue.start(job.id, probe);
  queue.finish(job.id, ["/vod/1/1080p/index.m3u8"]);
  assert.equal(queue.rows.get(job.id)?.status, "ready");
});
