const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const friendRoutes = require("./routes/friendRoutes");

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendRoutes);

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // 🟢 Add online user
  socket.on("addUser", (userId) => {
    onlineUsers.set(String(userId), socket.id);
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
  });

  // 💬 PRIVATE MESSAGE SYSTEM
  socket.on("sendPrivateMessage", (data) => {
    const receiverSocketId = onlineUsers.get(
      String(data.receiver_id)
    );

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "receivePrivateMessage",
        {
          ...data,
          status: "delivered",
        }
      );

      socket.emit("messageDelivered", {
        message_id: data.temp_id,
      });
    } else {
      socket.emit("messageSent", {
        message_id: data.temp_id,
      });
    }
  });

  // 👀 Message Seen
  socket.on("markSeen", ({ sender_id }) => {
    const senderSocketId = onlineUsers.get(
      String(sender_id)
    );

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSeen");
    }
  });

  // ⌨️ Typing Indicator
  socket.on("typing", ({ sender_id, receiver_id }) => {
    const receiverSocketId = onlineUsers.get(
      String(receiver_id)
    );
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("showTyping", {
        sender_id,
      });
    }
  });

  socket.on("stopTyping", ({ receiver_id }) => {
    const receiverSocketId = onlineUsers.get(
      String(receiver_id)
    );
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("hideTyping");
    }
  });

  // 🔥 REAL-TIME FRIEND REQUEST SYSTEM

  socket.on("sendFriendRequest", ({ receiverId }) => {
    const receiverSocketId = onlineUsers.get(
      String(receiverId)
    );

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newFriendRequest");
    }
  });

  socket.on("friendRequestAccepted", ({ receiverId }) => {
    const receiverSocketId = onlineUsers.get(
      String(receiverId)
    );

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("friendAdded");
    }
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});