export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export function resolveLogLevel(): LogLevel {
  const fromEnv = (process.env.LOG_LEVEL ?? "").toLowerCase() as LogLevel;
  if (fromEnv in LOG_LEVEL_RANK) return fromEnv;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

export function isLevelEnabled(configured: LogLevel, candidate: LogLevel): boolean {
  return LOG_LEVEL_RANK[candidate] >= LOG_LEVEL_RANK[configured];
}

export function serializeError(error: unknown): unknown {
  if (error instanceof Error) {
    const result: Record<string, unknown> = {
      name: error.name,
      message: error.message,
    };
    if (error.stack) result.stack = error.stack;
    if (error.cause !== undefined && error.cause !== null) {
      result.cause = serializeError(error.cause);
    }
    if ("code" in error) result.code = (error as { code?: unknown }).code;
    return result;
  }
  return error;
}

export interface FormatLogOptions {
  service: string;
  requestId?: string;
}

export function formatLog(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
  options?: FormatLogOptions,
): string {
  const payload: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    service: options?.service ?? "app",
    level,
    message,
  };
  if (options?.requestId) payload.requestId = options.requestId;
  if (meta && Object.keys(meta).length > 0) {
    for (const [key, value] of Object.entries(meta)) {
      payload[key] = value instanceof Error ? serializeError(value) : value;
    }
  }
  return JSON.stringify(payload);
}
