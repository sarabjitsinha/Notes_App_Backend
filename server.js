import express from "express";
import http from "http";
import { Server } from "socket.io";
// import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { setupSocket } from "./socket/index.js";

dotenv.config();
connectDB();
console.log("server loaded")
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173",credentials:true,exposedHeaders:["x-token"] }
});

app.use(cors({ origin: process.env.CLIENT_URL,credentials:true, exposedHeaders:["x-token"]}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/chat", chatRoutes);

setupSocket(io)

const PORT = process.env.PORT || 4500;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
