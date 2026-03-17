import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const users = {};

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // join user
  socket.on("join", (userId) => {
    users[userId] = socket.id;
    console.log(`✅ User joined: ${userId} -> ${socket.id}`);
    console.log("👥 Current users:", users);
  });

  // offer
  socket.on("offer", ({ to, offer, from }) => {
    console.log(`📤 Offer from ${from} to ${to}`);

    const target = users[to];
    if (target) {
      io.to(target).emit("offer", { offer, from });
      console.log("✅ Offer sent");
    } else {
      console.log("❌ Target not found");
    }
  });

  // answer
  socket.on("answer", ({ to, answer, from }) => {
    console.log(`📥 Answer from ${from} to ${to}`);

    const target = users[to];
    if (target) {
      io.to(target).emit("answer", { answer });
      console.log("✅ Answer sent");
    }
  });

  // ICE
  socket.on("ice-candidate", ({ to, candidate, from }) => {
    console.log(`🧊 ICE from ${from} to ${to}`);

    const target = users[to];
    if (target) {
      io.to(target).emit("ice-candidate", { candidate });
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    for (let id in users) {
      if (users[id] === socket.id) {
        console.log(`🗑 Removing user: ${id}`);
        delete users[id];
      }
    }

    console.log("👥 Remaining users:", users);
  });
});

app.get("/", (req, res) => {
  res.send("Socket server running 🚀");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});