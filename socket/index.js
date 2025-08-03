import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import Group from "../models/Group.js";

const onlineUsers = new Map(); // userId -> socketId

export const setupSocket = (io) => {
  console.log("Hello from io")
  io.use(async (socket, next) => {
    
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Missing token"));
      const decoded =jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id username");
      if (!user) return next(new Error("User not found"));
      socket.user = user;
          next();
    } catch (err) {
      return next(new Error("Auth error"));
    }
  });

  io.on("connection", (socket) => {

     if (!socket.user || !socket.user._id) {
    console.log("❌ Unauthorized socket connected. Disconnecting:", socket.id);
    return socket.disconnect(true);
  }


    const userId = socket.user._id.toString();
    console.log("On connection",userId)
    onlineUsers.set(userId, socket.id);
    console.log(`✅ ${socket.user.username} connected : ${socket.id}`);

    socket.on("join-group", async ({ groupId }) => {
  const group = await Group.findById(groupId);

  const approved = group?.approvedBy || [];
  if (group && approved.includes(socket.user._id.toString())) {
    socket.join(groupId);
    socket.emit("group-joined", groupId);
  } else {
    socket.emit("join-error", "You are not approved for this group.");
  }
});


socket.on("logout", () => {
  const userId = socket.user?._id?.toString();

  if (userId && onlineUsers.has(userId)) {
    onlineUsers.delete(userId);
    console.log(`🔒 ${socket.user.username} logged out via logout event`);

    socket.disconnect(true);
  }
});

    // Group message handler
    socket.on("group-message", async ({ groupId, content }) => {
      console.log("Inside group message")
      const msg = await Chat.create({
        sender: socket.user.id,
        groupId,
        message: content,
        timestamp: new Date(),
      });

      io.to(groupId).emit("group-message", {
        _id: msg._id,
        from: msg.sender,
        groupId,
        content: msg.message,
        timestamp: msg.timestamp,
      });
    });



socket.on("share-note", ({ groupId, note }) => {
  //  validate sender is in group
  io.to(groupId).emit("note-shared", {
    from: socket.user._id,
    note,
    timestamp: new Date(),
  });
});


    socket.on("private_message", async ({ to, content }) => {
      const from = socket.user._id.toString();
      
      if (from === to) return;

          const msg = await Chat.create({
          sender: from,
          receiver: to,
          message: content,
          timestamp: new Date(),
        });
      

      const toSocketId = onlineUsers.get(to);
           
      if (toSocketId) {
        io.to(toSocketId).emit("message", {
          _id: msg._id,
          from,
          to,
          content: msg.message,
          timestamp: msg.timestamp,
        });
      }

      
      // Also emit back to sender
      socket.emit("message", {
        _id: msg._id,
        from,
        to,
        content: msg.message,
        timestamp: msg.timestamp,
      });
    });



    

    socket.on("typing", ({ to }) => {
      const toSocketId = onlineUsers.get(to);
      if (toSocketId) {
        io.to(toSocketId).emit("typing", { from: socket.user._id });
      }
    });

    socket.on("stop_typing", ({ to }) => {
      const toSocketId = onlineUsers.get(to);
      if (toSocketId) {
        io.to(toSocketId).emit("stop_typing", { from: socket.user._id });
      }
    });

    socket.on("disconnect", () => {
          onlineUsers.delete(userId);
          socket.disconnect(true)
      console.log(`❌ ${socket.user.username} disconnected`);
    
    });
  });
};


