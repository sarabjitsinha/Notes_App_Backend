
import express from "express";
import {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  bulkUpdateNotes,
  shareNoteTransaction
} from "../controllers/notesController.mjs";

import { protect } from "../middleware/authMiddleware.mjs";

const router = express.Router();
router.use(protect);

router.get("/", getNotes);
router.post("/", createNote);
router.put("/bulk", bulkUpdateNotes);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);
router.post("/share", shareNoteTransaction);

export default router;
