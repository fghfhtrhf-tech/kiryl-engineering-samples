import type { Probe } from "./probe.js";
import { ladderFor } from "./probe.js";

export function masterPlaylist(probe: Probe, base: string): string {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];
  for (const rung of ladderFor(probe)) {
    const bw = Number(rung.bitrate.replace("k", "000"));
    lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bw},RESOLUTION=${Math.round((probe.width * rung.height) / probe.height)}x${rung.height}`);
    lines.push(`${base}/${rung.name}/index.m3u8`);
  }
  return lines.join("\n");
}

export function mediaPlaylist(segmentSec: number, count: number, prefix: string): string {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3", `#EXT-X-TARGETDURATION:${Math.ceil(segmentSec)}`, "#EXT-X-PLAYLIST-TYPE:VOD"];
  for (let i = 0; i < count; i++) {
    lines.push(`#EXTINF:${segmentSec.toFixed(3)},`);
    lines.push(`${prefix}/seg${String(i).padStart(5, "0")}.ts`);
  }
  lines.push("#EXT-X-ENDLIST");
  return lines.join("\n");
}
