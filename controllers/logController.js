import mongoose from "mongoose";
import Note from "../models/Note.js";
import Log from "../models/Log.js"; // optional audit log model

export const shareNoteTransaction = async (req, res) => {
  const { noteId, userIds } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const note = await Note.findOne({ _id: noteId, owner: req.user._id }).session(session);
    if (!note) throw new Error("Note not found");

    note.sharedWith = [...new Set([...note.sharedWith, ...userIds])];
    await note.save({ session });

    await Log.create([{
      action: "share",
      noteId,
      performedBy: req.user._id,
      sharedWith: userIds,
    }], { session });

    await session.commitTransaction();
    res.json({ msg: "Note shared with selected users" });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ msg: "Transaction failed", error: err.message });
  } finally {
    session.endSession();
  }
};
