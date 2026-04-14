import type { Express, RequestHandler } from "express";
import client from "prom-client";

let defaultMetricsRegistered = false;

function ensureDefaultMetrics(): void {
  if (defaultMetricsRegistered) return;
  defaultMetricsRegistered = true;
  client.collectDefaultMetrics();
}

/**
 * Express handler for Prometheus scrape (`Content-Type` + metrics body).
 */
export function metricsHandler(): RequestHandler {
  ensureDefaultMetrics();
  return async (_req, res) => {
    res.setHeader("Content-Type", client.register.contentType);
    res.send(await client.register.metrics());
  };
}

/** Registers `GET /metrics` on the given Express app. */
export function mountMetricsRoute(app: Express, path = "/metrics"): void {
  app.get(path, metricsHandler());
}
