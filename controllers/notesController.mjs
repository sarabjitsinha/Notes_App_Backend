import mongoose from "mongoose";
import Note from "../models/Note.js";
import Log from "../models/Log.js";



// Create a new note
export const createNote = async (req, res) => {
  try {
    const note = await Note.create({ ...req.body, owner: req.user._id });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get all notes owned or shared with the user 
export const getNotes = async (req, res) => {
  try {
    const filter = {
      $or: [{ owner: req.user._id }, { sharedWith: req.user._id }],
    };

    if (req.query.archived === "true") filter.archived = true;
    if (req.query.pinned === "true") filter.pinned = true;

    const notes = await Note.find(filter).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Update a single note
export const updateNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );
    if (!note) return res.status(404).json({ msg: "Note not found or access denied" });
    res.json(note);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Delete a single note
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!note) return res.status(404).json({ msg: "Note not found or access denied" });
    res.json({ msg: "Note deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// 🔁 BULK OPERATIONS

// Bulk update multiple notes (e.g., pin/archive)
export const bulkUpdateNotes = async (req, res) => {
  const { noteIds, update } = req.body;

  try {
    const result = await Note.updateMany(
      { _id: { $in: noteIds }, owner: req.user._id },
      { $set: update }
    );
    res.json({ msg: `${result.modifiedCount} notes updated` });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// 🔄 TRANSACTIONAL

// Share note with users + log the action
export const shareNoteTransaction = async (req, res) => {
  const { noteId, userIds } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const note = await Note.findOne({ _id: noteId, owner: req.user._id }).session(session);
    if (!note) throw new Error("Note not found or access denied");

    // Merge and deduplicate sharedWith list
    note.sharedWith = [...new Set([...note.sharedWith, ...userIds])];
    await note.save({ session });

    await Log.create([{
      action: "share",
      noteId,
      performedBy: req.user._id,
      sharedWith: userIds,
    }], { session });

    await session.commitTransaction();
    res.json({ msg: "Note shared successfully" });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ msg: "Transaction failed", error: err.message });
  } finally {
    session.endSession();
  }
};
