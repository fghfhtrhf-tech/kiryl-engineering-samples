export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogLine = {
  level: LogLevel;
  msg: string;
  at: string;
  ctx?: Record<string, unknown>;
};

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export class Logger {
  readonly lines: LogLine[] = [];

  constructor(readonly min: LogLevel = "info") {}

  private write(level: LogLevel, msg: string, ctx?: Record<string, unknown>) {
    if (ORDER[level] < ORDER[this.min]) return;
    this.lines.push({ level, msg, at: new Date().toISOString(), ctx });
  }

  debug(msg: string, ctx?: Record<string, unknown>) {
    this.write("debug", msg, ctx);
  }
  info(msg: string, ctx?: Record<string, unknown>) {
    this.write("info", msg, ctx);
  }
  warn(msg: string, ctx?: Record<string, unknown>) {
    this.write("warn", msg, ctx);
  }
  error(msg: string, ctx?: Record<string, unknown>) {
    this.write("error", msg, ctx);
  }
}
