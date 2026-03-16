const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');

// GET all notes for user
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new note
router.post('/', auth, async (req, res) => {
  try {
    const note = new Note({
      userId: req.user.id,
      title: req.body.title,
      content: req.body.content
    });
    const newNote = await note.save();
    res.status(201).json(newNote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE a note
router.put('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title: req.body.title, content: req.body.content },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Anotação não encontrada' });
    res.json(note);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a note
router.delete('/:id', auth, async (req, res) => {
    try {
        await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ message: 'Anotação excluída' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
