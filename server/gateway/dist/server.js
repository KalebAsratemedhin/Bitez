import express from "express";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";
const app = express();
app.use(morgan("combined"));
const PORT = Number(process.env.PORT) || 8080;
const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const restaurantUrl = process.env.RESTAURANT_SERVICE_URL || "http://localhost:3002";
const orderUrl = process.env.ORDER_SERVICE_URL || "http://localhost:3003";
const deliveryUrl = process.env.DELIVERY_SERVICE_URL || "http://localhost:3004";
const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3005";
const dashboardUrl = process.env.DASHBOARD_SERVICE_URL || "http://localhost:3006";
const proxyOptions = {
    changeOrigin: true,
    onProxyReq(proxyReq, req) {
        if (req.headers.authorization) {
            proxyReq.setHeader("Authorization", req.headers.authorization);
        }
    },
};
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use("/auth", createProxyMiddleware({ target: authUrl, pathRewrite: { "^/auth": "" }, ...proxyOptions }));
app.use("/user", createProxyMiddleware({ target: authUrl, pathRewrite: { "^/user": "" }, ...proxyOptions }));
// Restaurant service: menu, rating, uploads, and restaurant routes all live here
app.use("/restaurant", createProxyMiddleware({ target: restaurantUrl, pathRewrite: { "^/restaurant": "" }, ...proxyOptions }));
app.use("/order", createProxyMiddleware({ target: orderUrl, pathRewrite: { "^/order": "" }, ...proxyOptions }));
app.use("/delivery", createProxyMiddleware({ target: deliveryUrl, ...proxyOptions }));
app.use("/notification", createProxyMiddleware({ target: notificationUrl, pathRewrite: { "^/notification": "" }, ...proxyOptions }));
app.use("/dashboard", createProxyMiddleware({ target: dashboardUrl, pathRewrite: { "^/dashboard": "" }, ...proxyOptions }));
app.get("/health", (_req, res) => res.json({ status: "ok", service: "gateway" }));
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gateway listening on port ${PORT}`);
});
//# sourceMappingURL=server.js.map