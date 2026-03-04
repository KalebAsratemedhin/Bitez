import { io } from "socket.io-client";

const wsUrl =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_WS_URL?.trim()) ||
  "";

const socket = io(wsUrl || "http://localhost:5000", {
  path: "/socket.io/",
  transports: ["websocket"],
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  withCredentials: true,
});

export const hasSocketServer = Boolean(wsUrl);
export default socket;