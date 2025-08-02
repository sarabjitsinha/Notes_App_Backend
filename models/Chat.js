import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  groupId: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Chat", chatSchema);

