const express = require("express");
const cors = require("cors");
// const fs = require("fs");
const http = require("http");
const socket = require("socket.io");
const {
  userJoin,
  getUserById,
  userLeave,
  getRoomUsers,
  getUsers,
} = require("./utils/users");

// http.globalAgent.options.rejectUnauthorized = false;
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const port = process.env.PORT || 3001;

const corsOptions = {
  origin: "*",
  optionSuccessStatus: 200,
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));

// const options = {
//   key: fs.readFileSync("keys/privatekey.pem"),
//   cert: fs.readFileSync("keys/certificate.pem"),
// };

const server = http.createServer(app);

const io = socket(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("joinStreamer", ({ room, username }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    socket.broadcast.to(user.room).emit("message", {
      user: "Chat Bot",
      chatMessage: `${user.username} has joined the chat.`,
    });

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  socket.on("broadcast-started", () => {
    io.emit("liveEvent");
  });

  socket.on("chatMessage", (message) => {
    const user = getUserById(socket.id);
    io.to(user.room).emit("message", message);
  });

  socket.on("broadcast-stopped", () => {
    io.emit("liveEvent");
  });

  socket.on("broadcast-resumed", () => {
    const user = getUserById(socket.id);
    socket.broadcast.to(user.room).emit("reconnect");
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "Chat Bot",
        chatMessage: `${user.username} has left the chat.`,
      });

      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up and running at port ${port}`);
});
