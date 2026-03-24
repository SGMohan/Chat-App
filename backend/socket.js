const { Server } = require("socket.io");

let io;
const userSocketMap = {}; // { userId: connectionCount }

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId && userId !== "undefined") {
      socket.join(userId);
      userSocketMap[userId] = (userSocketMap[userId] || 0) + 1;
      console.log(`User connected: ${userId} (Total connections: ${userSocketMap[userId]})`);
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Handle typing indicators
    socket.on("typing", ({ receiverId }) => {
      socket.to(receiverId).emit("userTyping", { senderId: userId });
    });

    socket.on("stopTyping", ({ receiverId }) => {
      socket.to(receiverId).emit("userStopTyping", { senderId: userId });
    });

    socket.on("disconnect", () => {
      if (userId && userSocketMap[userId]) {
        userSocketMap[userId]--;
        if (userSocketMap[userId] <= 0) {
          delete userSocketMap[userId];
        }
        console.log(`User disconnected: ${userId} (Remaining: ${userSocketMap[userId] || 0})`);
      }
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket not initialized");
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
  userSocketMap,
};

