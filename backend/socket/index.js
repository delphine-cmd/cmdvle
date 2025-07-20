import { Server } from "socket.io";
import { handleRoomSocket } from "./roomHandlers.js";
import { handleStackSocket } from "./stackHandlers.js"; // ✅ NEW

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    handleRoomSocket(io, socket);
    handleStackSocket(io, socket); // ✅ ADD THIS
  });
}
