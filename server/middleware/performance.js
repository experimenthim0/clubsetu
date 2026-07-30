import zlib from "node:zlib";
import { randomUUID } from "node:crypto";

const DEFAULT_MAX_IN_FLIGHT = 250;
let inFlightRequests = 0;

const numberFromEnv = (name, fallback) => {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const getPerformanceStats = () => ({
  inFlightRequests,
  maxInFlightRequests: numberFromEnv("MAX_IN_FLIGHT_REQUESTS", DEFAULT_MAX_IN_FLIGHT),
});

export const overloadProtection = (req, res, next) => {
  if (req.method === "OPTIONS" || req.path === "/health") return next();

  const maxInFlight = numberFromEnv("MAX_IN_FLIGHT_REQUESTS", DEFAULT_MAX_IN_FLIGHT);
  if (inFlightRequests >= maxInFlight) {
    res.set("Retry-After", process.env.OVERLOAD_RETRY_AFTER_SECONDS || "15");
    return res.status(503).json({
      success: false,
      code: "MAINTENANCE_OVERLOAD",
      message: "The website is temporarily busy. Please try again shortly.",
    });
  }

  inFlightRequests += 1;
  let released = false;
  const release = () => {
    if (!released) {
      released = true;
      inFlightRequests = Math.max(0, inFlightRequests - 1);
    }
  };
  res.once("finish", release);
  res.once("close", release);
  next();
};

export const requestMetrics = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.setHeader("X-Request-Id", req.headers["x-request-id"] || randomUUID());
  const originalEnd = res.end.bind(res);
  res.end = (chunk, encoding, callback) => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    res.setHeader("X-Response-Time", `${durationMs.toFixed(1)}ms`);
    return originalEnd(chunk, encoding, callback);
  };

  res.once("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const slowThreshold = numberFromEnv("SLOW_REQUEST_MS", 300);
    if (durationMs >= slowThreshold || res.statusCode >= 500) {
      console.warn(`[Performance] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`);
    }
  });
  next();
};

export const publicReadCache = (req, res, next) => {
  const isPublicRead = req.method === "GET" &&
    req.path.startsWith("/api/") &&
    !req.headers.authorization &&
    !req.headers.cookie &&
    !req.path.includes("/download") &&
    !req.path.includes("/export");

  if (isPublicRead) {
    res.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=30");
  }
  next();
};

export const apiCompression = (req, res, next) => {
  if (!req.path.startsWith("/api/") || req.path.includes("/download") || req.path.includes("/export")) {
    return next();
  }

  const accepts = String(req.headers["accept-encoding"] || "");
  const encoding = accepts.includes("br") ? "br" : accepts.includes("gzip") ? "gzip" : null;
  if (!encoding) return next();

  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);
  const chunks = [];
  const toBuffer = (chunk, args) => Buffer.isBuffer(chunk)
    ? chunk
    : Buffer.from(chunk, typeof args[0] === "string" ? args[0] : undefined);
  res.write = (chunk, ...args) => {
    if (chunk) chunks.push(toBuffer(chunk, args));
    return true;
  };
  res.end = (chunk, ...args) => {
    if (chunk) chunks.push(toBuffer(chunk, args));
    const body = Buffer.concat(chunks);
    const contentType = String(res.getHeader("Content-Type") || "");
    const compressible = contentType.includes("json") || contentType.startsWith("text/") || contentType.includes("javascript");

    if (!compressible || body.length < 1024 || res.headersSent) {
      res.write = originalWrite;
      res.end = originalEnd;
      return originalEnd(body, ...args);
    }

    const compressed = encoding === "br" ? zlib.brotliCompressSync(body) : zlib.gzipSync(body);
    res.removeHeader("Content-Length");
    res.setHeader("Content-Encoding", encoding);
    res.setHeader("Vary", "Accept-Encoding");
    return originalEnd(compressed);
  };
  next();
};
