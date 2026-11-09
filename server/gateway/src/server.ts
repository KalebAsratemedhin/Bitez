import type { ClientRequest } from "node:http";
import express from "express";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";
import {
  createLogger,
  requestContextMiddleware,
  mountMetricsRoute,
  createErrorHandler,
} from "@bitez/shared";

const SERVICE_NAME = "gateway";
const logger = createLogger({ serviceName: SERVICE_NAME });
const app = express();

app.use(requestContextMiddleware);
morgan.token("requestId", (req) => (req as { context?: { requestId?: string } }).context?.requestId ?? "-");
app.use(morgan(":method :url :status :response-time ms requestId=:requestId"));

const PORT = Number(process.env.PORT) || 8080;

const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const restaurantUrl = process.env.RESTAURANT_SERVICE_URL || "http://localhost:3002";
const orderUrl = process.env.ORDER_SERVICE_URL || "http://localhost:3003";

const proxyOptions = {
  changeOrigin: true,
  onProxyReq(proxyReq: ClientRequest, req: express.Request) {
    if (req.headers.authorization) {
      proxyReq.setHeader("Authorization", req.headers.authorization);
    }
  },
};

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
}));

app.use("/auth", createProxyMiddleware({ target: authUrl, pathRewrite: { "^/auth": "" }, ...proxyOptions }));
app.use("/user", createProxyMiddleware({ target: authUrl, pathRewrite: { "^/user": "" }, ...proxyOptions }));
app.use("/restaurant", createProxyMiddleware({ target: restaurantUrl, pathRewrite: { "^/restaurant": "" }, ...proxyOptions }));
app.use("/order", createProxyMiddleware({ target: orderUrl, pathRewrite: { "^/order": "" }, ...proxyOptions }));
// Delivery + notifications live inside order; keep /delivery public path, map /notifications under /order
app.use("/delivery", createProxyMiddleware({
  target: orderUrl,
  pathRewrite: { "^/delivery": "/delivery" },
  ...proxyOptions,
}));
app.use("/notifications", createProxyMiddleware({
  target: orderUrl,
  pathRewrite: { "^/notifications": "/notifications" },
  ...proxyOptions,
}));

app.get("/health", (_req, res) => res.json({ status: "ok", service: SERVICE_NAME }));
mountMetricsRoute(app);
app.use(createErrorHandler(logger));

app.listen(PORT, "0.0.0.0");
logger.info({ port: PORT }, "Gateway started");
