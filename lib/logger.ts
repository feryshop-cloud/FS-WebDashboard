/**
 * Structured Logger for game-inventori (Admin ERP)
 * Outputs structured JSON logs suitable for Railway / Cloudwatch stdout aggregation.
 *
 * Level filtering: controlled by LOG_LEVEL (debug|info|warn|error), default info in prod, debug in dev.
 * Error values passed via meta are serialized with name/message/stack/cause.
 * When running inside a request context (see runAction), each line carries `requestId`.
 */
import {
  formatLog,
  isLevelEnabled,
  resolveLogLevel,
  serializeError,
  type LogLevel,
} from "@/lib/logging/format";
import { getRequestId } from "@/lib/logging/request-context";

const SERVICE = "game-inventori";
const configuredLevel = resolveLogLevel();

function write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (!isLevelEnabled(configuredLevel, level)) return;
  const line = formatLog(level, message, meta, {
    service: SERVICE,
    requestId: getRequestId(),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    write("debug", message, meta);
  },
  info(message: string, meta?: Record<string, unknown>) {
    write("info", message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    write("warn", message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    write("error", message, meta);
  },
  serializeError,
};
