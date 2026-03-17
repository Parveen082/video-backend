import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // later apna Netlify URL dal dena
    methods: ["GET", "POST"]
  }
});

// 👇 users store karne ke liye
const users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // user join
  socket.on("join", (userId) => {
    users[userId] = socket.id;
    console.log("User joined:", userId);
  });

  // call offer
  socket.on("offer", ({ to, offer, from }) => {
    const target = users[to];
    if (target) {
      io.to(target).emit("offer", { offer, from });
    }
  });

  // call answer
  socket.on("answer", ({ to, answer }) => {
    const target = users[to];
    if (target) {
      io.to(target).emit("answer", { answer });
    }
  });

  // ICE candidates
  socket.on("ice-candidate", ({ to, candidate }) => {
    const target = users[to];
    if (target) {
      io.to(target).emit("ice-candidate", { candidate });
    }
  });

  // disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (let id in users) {
      if (users[id] === socket.id) {
        delete users[id];
      }
    }
  });
});

// health check route
app.get("/", (req, res) => {
  res.send("Socket server running 🚀");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});