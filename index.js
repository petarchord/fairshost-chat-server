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
  origin: "http://localhost:3000",
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
    origin: "http://localhost:3000",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("new WS connection with socketid:", socket.id);

  socket.on("joinStreamer", ({ room, username }) => {
    console.log("users before join:", getUsers());
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    socket.broadcast.to(user.room).emit("message", {
      user: "Chat Bot",
      chatMessage: `${user.username} has joined the chat.`,
    });

    console.log("roomUsers:", getRoomUsers(user.room));

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  socket.on("chatMessage", (message) => {
    const user = getUserById(socket.id);
    console.log("message", JSON.stringify(message));

    io.to(user.room).emit("message", message);
  });

  socket.on("broadcast-resumed", () => {
    console.log("broadcast-resumed message received");
    const user = getUserById(socket.id);
    socket.broadcast.to(user.room).emit("reconnect");
  });

  socket.on("disconnect", () => {
    console.log(`client with socket id: ${socket.id} disconnected`);
    const user = userLeave(socket.id);
    if (user) {
      console.log("users after userLeave:", getUsers());
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
