import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: "" },
  labels: [{ type: String }],
  archived: { type: Boolean, default: false },
  pinned: { type: Boolean, default: false },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, {
  timestamps: true,
});

export default mongoose.model("Note", noteSchema);
