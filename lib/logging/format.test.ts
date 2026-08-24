import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { serializeError, formatLog, resolveLogLevel, isLevelEnabled } from "@/lib/logging/format";

describe("serializeError", () => {
  it("serializes an Error into { type, message, stack }", () => {
    const err = new TypeError("bad input");
    const result = serializeError(err) as Record<string, unknown>;

    expect(result.type).toBe("TypeError");
    expect(result.message).toBe("bad input");
    expect(typeof result.stack).toBe("string");
  });

  it("preserves .code property on Error", () => {
    const err = new Error("not found") as Error & { code?: string };
    err.code = "ENOENT";
    const result = serializeError(err) as Record<string, unknown>;

    expect(result.code).toBe("ENOENT");
  });

  it("recursively serializes error.cause", () => {
    const cause = new Error("root cause");
    const err = new Error("wrapper", { cause });
    const result = serializeError(err) as Record<string, unknown>;
    const serializedCause = result.cause as Record<string, unknown>;

    expect(serializedCause.type).toBe("Error");
    expect(serializedCause.message).toBe("root cause");
  });

  it("uses 'Error' as type when error.name is empty", () => {
    const err = new Error("test");
    err.name = "";
    const result = serializeError(err) as Record<string, unknown>;

    expect(result.type).toBe("Error");
  });

  it("serializes error-like plain objects (has message or stack)", () => {
    const errLike = { name: "CustomErr", message: "something broke", stack: "at ..." };
    const result = serializeError(errLike) as Record<string, unknown>;

    expect(result.type).toBe("CustomErr");
    expect(result.message).toBe("something broke");
    expect(result.stack).toBe("at ...");
  });

  it("defaults type to 'Error' for error-like plain objects without string name", () => {
    const errLike = { message: "oops" };
    const result = serializeError(errLike) as Record<string, unknown>;

    expect(result.type).toBe("Error");
    expect(result.message).toBe("oops");
  });

  it("passes through plain objects without message/stack untouched", () => {
    const obj = { foo: "bar", count: 42 };
    expect(serializeError(obj)).toBe(obj);
  });

  it("passes through primitives untouched", () => {
    expect(serializeError("string error")).toBe("string error");
    expect(serializeError(42)).toBe(42);
    expect(serializeError(null)).toBe(null);
    expect(serializeError(undefined)).toBe(undefined);
  });
});

describe("formatLog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a JSON string with required fields", () => {
    const output = formatLog("info", "server started", undefined, { service: "test-svc" });
    const parsed = JSON.parse(output);

    expect(parsed.level).toBe(30); // info = 30
    expect(parsed.time).toBe(Date.now());
    expect(parsed.service).toBe("test-svc");
    expect(parsed.msg).toBe("server started");
  });

  it("defaults service to 'app' when not provided", () => {
    const output = formatLog("debug", "msg");
    const parsed = JSON.parse(output);

    expect(parsed.service).toBe("app");
  });

  it("includes requestId when provided", () => {
    const output = formatLog("info", "req", undefined, {
      service: "svc",
      requestId: "abc-123",
    });
    const parsed = JSON.parse(output);

    expect(parsed.requestId).toBe("abc-123");
  });

  it("omits requestId when not provided", () => {
    const output = formatLog("info", "req", undefined, { service: "svc" });
    const parsed = JSON.parse(output);

    expect(parsed).not.toHaveProperty("requestId");
  });

  it("flattens meta fields into payload", () => {
    const output = formatLog(
      "warn",
      "slow query",
      { durationMs: 1200, table: "products" },
      {
        service: "svc",
      },
    );
    const parsed = JSON.parse(output);

    expect(parsed.durationMs).toBe(1200);
    expect(parsed.table).toBe("products");
  });

  it("serializes Error in meta under 'err' key", () => {
    const err = new Error("boom");
    const output = formatLog("error", "fail", { error: err }, { service: "svc" });
    const parsed = JSON.parse(output);

    expect(parsed.err).toBeDefined();
    expect(parsed.err.type).toBe("Error");
    expect(parsed.err.message).toBe("boom");
    // 'error' key should not appear; it's remapped to 'err'
    expect(parsed).not.toHaveProperty("error");
  });

  it("serializes Error values in other meta keys", () => {
    const err = new TypeError("bad");
    const output = formatLog("error", "fail", { originalError: err }, { service: "svc" });
    const parsed = JSON.parse(output);

    expect(parsed.originalError.type).toBe("TypeError");
    expect(parsed.originalError.message).toBe("bad");
  });

  it("skips empty meta object", () => {
    const output = formatLog("info", "msg", {}, { service: "svc" });
    const parsed = JSON.parse(output);

    // Only standard fields
    expect(Object.keys(parsed).sort()).toEqual(
      ["environment", "level", "msg", "service", "time"].sort(),
    );
  });

  it("uses correct numeric level for each log level", () => {
    expect(JSON.parse(formatLog("debug", "m")).level).toBe(20);
    expect(JSON.parse(formatLog("info", "m")).level).toBe(30);
    expect(JSON.parse(formatLog("warn", "m")).level).toBe(40);
    expect(JSON.parse(formatLog("error", "m")).level).toBe(50);
  });
});

describe("resolveLogLevel", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns LOG_LEVEL from env when valid", () => {
    process.env.LOG_LEVEL = "warn";
    expect(resolveLogLevel()).toBe("warn");
  });

  it("defaults to 'info' in production when LOG_LEVEL not set", () => {
    delete process.env.LOG_LEVEL;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    expect(resolveLogLevel()).toBe("info");
  });

  it("defaults to 'debug' in non-production when LOG_LEVEL not set", () => {
    delete process.env.LOG_LEVEL;
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    expect(resolveLogLevel()).toBe("debug");
  });
});

describe("isLevelEnabled", () => {
  it("allows same level", () => {
    expect(isLevelEnabled("info", "info")).toBe(true);
  });

  it("allows higher severity", () => {
    expect(isLevelEnabled("info", "error")).toBe(true);
  });

  it("blocks lower severity", () => {
    expect(isLevelEnabled("warn", "debug")).toBe(false);
  });
});
