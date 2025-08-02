import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true, enum: ["create", "update", "delete", "share", "archive", "pin"] },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // optional
  timestamp: { type: Date, default: Date.now },
  meta: mongoose.Schema.Types.Mixed // optional details
});

export default mongoose.model("Log", logSchema);
