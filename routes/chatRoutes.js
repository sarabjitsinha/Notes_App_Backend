import express from "express";
import Chat from "../models/Chat.js";
import { protect } from "../middleware/authMiddleware.mjs";
import {
  getUsers,
  getGroups,
  startChat,
  respondChatRequest,
  getMessages
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/users", protect, getUsers);
router.get("/groups", protect, getGroups);
router.post("/start", protect, startChat);
router.post("/respond", protect, respondChatRequest);
router.get("/messages/:type/:id", protect, getMessages);

router.get("/messages/:userId", protect, async (req, res) => {
  const { userId } = req.params;
  console.log("From chat message",userId)
  const messages = await Chat.find({
    $or: [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id },
    ],
  }).sort({ timestamp: 1 });

  res.json(messages);
});

export default router;
