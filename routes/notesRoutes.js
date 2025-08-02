// import express from "express";
// import {
//   createNote,
//   getNotes,
//   updateNote,
//   deleteNote,
//   bulkUpdateNotes
// } from "../controllers/notesController.js";
// import { protect } from "../middleware/authMiddleware.js";

// const router = express.Router();

// router.use(protect);

// router.get("/", getNotes);
// router.post("/", createNote);
// router.put("/bulk", bulkUpdateNotes);
// router.put("/:id", updateNote);
// router.delete("/:id", deleteNote);

// export default router;

// routes/notesRoutes.js
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
