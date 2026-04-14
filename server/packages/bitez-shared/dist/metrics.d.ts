import type { Express, RequestHandler } from "express";
/**
 * Express handler for Prometheus scrape (`Content-Type` + metrics body).
 */
export declare function metricsHandler(): RequestHandler;
/** Registers `GET /metrics` on the given Express app. */
export declare function mountMetricsRoute(app: Express, path?: string): void;
