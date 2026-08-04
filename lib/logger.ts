/**
 * Structured Logger for game-inventori (Admin ERP)
 * Outputs structured JSON logs suitable for Railway / Cloudwatch stdout aggregation.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  message: string;
  level: LogLevel;
  service: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const payload: LogPayload = {
    timestamp: new Date().toISOString(),
    service: "game-inventori",
    level,
    message,
    ...(meta ? { meta } : {}),
  };
  return JSON.stringify(payload);
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.log(formatLog("info", message, meta));
  },
  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(formatLog("warn", message, meta));
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(formatLog("error", message, meta));
  },
  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatLog("debug", message, meta));
    }
  },
};
