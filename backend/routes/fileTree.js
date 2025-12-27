import express from 'express';
// import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { requireAuth } from '../middleware/auth.js';
import { Document } from '../models/Document.js';

dotenv.config();
const router = express.Router();

router.use(requireAuth);

router.post("/addFolder", async (req, res) => {
    try{
        const {name, parentId, order} = req.body;
  const token = req.cookies?.access_token;
  const userID = req.user.id;


        const folder = await Document.create({name: name, parentId: parentId, order:order, type:"folder", userId: userID})
        res.status(201).json(folder);
    }catch(err){
        console.log(err);
        res.status(501).json({msg: "Error!"});
    }
})
router.post("/addNote", async (req, res) => {
  try {
    const { name, parentId, content = "", order } = req.body;
  const userID = req.user.id;


    if (!name) {
      return res.status(400).json({ msg: "Name is required" });
    }
    const note = await Document.create({
      name,
      parentId: parentId || null,
      content,
      order,
      type: "note",
      userId: userID
    });
    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error adding note" });
  }
});

router.get("/documents", async (req, res) => {
    const token = req.cookies?.access_token;
const userID = req.user.id;
console.log(userID)
    try{
        const docs = await Document.find({userId: userID}).sort({order:1})
        res.json(docs);
    }catch(err){
        console.log(err)
        res.status(501).json({msg: "ERROR"})
    }
})

router.post("/getNoteById", async (req, res) => {
  const { noteID } = req.body;
  const userID = req.user.id;
  const note = await Document.find({ _id: noteID, userId: userID });
  res.status(201).json(note);
});

router.post("/updateNote", async (req, res) => {
  try {
    const { noteID, content } = req.body;
    // FIX: Use req.user.id
    const userID = req.user.id;

    const note = await Document.findOneAndUpdate(
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


export default router;