import client from "prom-client";
let defaultMetricsRegistered = false;
function ensureDefaultMetrics() {
    if (defaultMetricsRegistered)
        return;
    defaultMetricsRegistered = true;
    client.collectDefaultMetrics();
}
/**
 * Express handler for Prometheus scrape (`Content-Type` + metrics body).
 */
export function metricsHandler() {
    ensureDefaultMetrics();
    return async (_req, res) => {
        res.setHeader("Content-Type", client.register.contentType);
        res.send(await client.register.metrics());
    };
}
/** Registers `GET /metrics` on the given Express app. */
export function mountMetricsRoute(app, path = "/metrics") {
    app.get(path, metricsHandler());
}
