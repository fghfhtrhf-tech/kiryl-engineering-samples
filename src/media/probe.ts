export type Probe = {
  durationSec: number;
  width: number;
  height: number;
  videoCodec: string;
  audioCodec: string | null;
  fps: number;
};

export function parseProbe(json: {
  format?: { duration?: string };
  streams?: Array<{ codec_type?: string; codec_name?: string; width?: number; height?: number; avg_frame_rate?: string }>;
}): Probe {
  const video = json.streams?.find((row) => row.codec_type === "video");
  const audio = json.streams?.find((row) => row.codec_type === "audio");
  if (!video?.width || !video.height) throw new Error("no_video");
  const [num, den] = (video.avg_frame_rate ?? "30/1").split("/").map(Number);
  return {
    durationSec: Number(json.format?.duration ?? 0),
    width: video.width,
    height: video.height,
    videoCodec: video.codec_name ?? "unknown",
    audioCodec: audio?.codec_name ?? null,
    fps: den ? Number((num / den).toFixed(2)) : 30
  };
}

export function ladderFor(probe: Probe): Array<{ name: string; height: number; bitrate: string }> {
  const rungs = [
    { name: "1080p", height: 1080, bitrate: "5000k" },
    { name: "720p", height: 720, bitrate: "2800k" },
    { name: "480p", height: 480, bitrate: "1200k" },
    { name: "360p", height: 360, bitrate: "800k" }
  ];
  return rungs.filter((row) => row.height <= probe.height);
}
