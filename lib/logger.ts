// lib/logger.ts — Structured JSON logging with request tracing

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  action: string;
  timestamp: string;
  requestId?: string;
  duration?: number;
  error?: string;
  [key: string]: unknown;
}

export function log(
  level: LogLevel,
  action: string,
  meta?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    level,
    action,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export function createRequestLogger(requestId?: string) {
  const id = requestId || crypto.randomUUID();
  const start = Date.now();

  return {
    requestId: id,
    info(action: string, meta?: Record<string, unknown>) {
      log("info", action, { requestId: id, ...meta });
    },
    warn(action: string, meta?: Record<string, unknown>) {
      log("warn", action, { requestId: id, ...meta });
    },
    error(action: string, meta?: Record<string, unknown>) {
      log("error", action, { requestId: id, ...meta });
    },
    done(action: string, meta?: Record<string, unknown>) {
      log("info", action, {
        requestId: id,
        duration: Date.now() - start,
        ...meta,
      });
    },
  };
}
