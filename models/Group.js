// import mongoose from "mongoose";

// const groupSchema = new mongoose.Schema({
//   name: String,
//   members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   approvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
// });

// export default mongoose.model("Group", groupSchema);

import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  approvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ✅ Add this line
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

export default mongoose.model("Group", groupSchema);
