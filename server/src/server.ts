import connectDB from "@config/db.js";
import setupSwagger from "@config/swagger.js";
import { createApp } from "@infrastructure/web/ExpressServer.js";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

connectDB();

const { app, setIo } = createApp();
setupSwagger(app);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket"],
  path: "/socket.io/",
});

io.on("connection", (socket) => {
  socket.on("join", (userId: string) => {
    socket.join(userId);
  });
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

setIo(io);
app.set("io", io);

const PORT = Number(process.env.PORT) || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
