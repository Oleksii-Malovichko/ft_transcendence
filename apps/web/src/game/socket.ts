import { io, type Socket } from "socket.io-client";

const OPTIONS = { path: "/socket.io", transports: ["websocket"] };

export function connectSocket(): Socket {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  return url ? io(url, OPTIONS) : io(OPTIONS);
}