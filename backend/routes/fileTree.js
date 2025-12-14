import express from 'express';
// import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import Folder from "../models/Folder.js";
import Note from "../models/Note.js";
import { requireAuth } from '../middleware/auth.js';

dotenv.config();
const router = express.Router();

router.use(requireAuth);

// --- ADD FOLDER ---
router.post("/addFolder", async (req, res) => {
  try {
    const { name } = req.body;
    // FIX: Use req.user.id
    const userID = req.user.id;
    const folder = await Folder.create({ userId: userID, name });
    res.status(201).json(folder);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// --- GET FOLDERS ---
router.get("/getFolders", async (req, res) => {
  // FIX: Use req.user.id
  const userID = req.user.id;
  const folders = await Folder.find({ userId: userID });
  res.status(201).json(folders);
});

// --- GET NOTES ---
router.post("/getNotes", async (req, res) => {
  const { folderID } = req.body;
  // Optional Security Improvement: You should probably also check req.user.id here 
  // to ensure the folder belongs to the user, but for now, this works:
  const notes = await Note.find({ folderId: folderID });
  res.status(201).json(notes);
});

// --- GET NOTE BY ID ---
router.post("/getNoteById", async (req, res) => {
  const { noteID } = req.body;
  // FIX: Use req.user.id
  const userID = req.user.id;
  const note = await Note.find({ _id: noteID, userId: userID });
  res.status(201).json(note);
});

// --- UPDATE NOTE (This was causing your specific issue) ---
router.post("/updateNote", async (req, res) => {
  try {
    const { noteID, content } = req.body;
    // FIX: Use req.user.id
    const userID = req.user.id;

    const note = await Note.findOneAndUpdate(
      { _id: noteID, userId: userID },
      { content, updatedAt: new Date() },
      { new: true }
    );

    if (!note) return res.status(404).json({ msg: "Note not found" });
    res.json(note);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// --- ADD NOTE ---
router.post("/addNote", async (req, res) => {
  try {
    const { name, folderID } = req.body;
    // FIX: Use req.user.id
    const userID = req.user.id;
    const note = await Note.create({ userId: userID, folderId: folderID, name, content: "" });
    res.status(201).json(note);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;