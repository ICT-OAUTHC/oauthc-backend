import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import TokenBlacklist from "./models/TokenBlacklist";

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:3000",
        ...(process.env.FRONTEND_URL?.split(",").map((u) => u.trim()).filter(Boolean) ?? []),
      ],
      credentials: true,
    },
  });

  // Auth middleware — verify JWT before allowing connection
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));

    try {
      // Check blacklist
      const blacklisted = await TokenBlacklist.findOne({ token });
      if (blacklisted) return next(new Error("Token revoked"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      (socket as any).userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket as any).userId as string;
    // Join a room named after the user's ID for targeted notifications
    socket.join(`user:${userId}`);

    socket.on("disconnect", () => {
      socket.leave(`user:${userId}`);
    });
  });

  return io;
}

/** Get the Socket.IO instance (call after initSocket) */
export function getIO(): Server {
  return io;
}
