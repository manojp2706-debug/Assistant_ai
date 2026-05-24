const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Upload note (PDF or text)
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  let content = '';
  let fileType = 'text';
  let title = req.body.title || 'Untitled Note';

  if (req.file) {
    fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'text';
    if (fileType === 'pdf') {
      const parsed = await pdfParse(req.file.buffer);
      content = parsed.text;
    } else {
      content = req.file.buffer.toString('utf-8');
    }
    title = req.body.title || req.file.originalname.replace(/\.[^/.]+$/, '');
  } else if (req.body.content) {
    content = req.body.content;
  } else {
    return res.status(400).json({ message: 'No content provided' });
  }

  const note = await Note.create({
    userId: req.userId,
    title,
    content,
    subject: req.body.subject || 'General',
    fileType,
  });

  res.status(201).json(note);
});

// Get all notes for user
router.get('/', auth, async (req, res) => {
  const notes = await Note.find({ userId: req.userId }).sort({ createdAt: -1 }).select('-content');
  res.json(notes);
});

// Get single note
router.get('/:id', auth, async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json(note);
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ message: 'Deleted' });
});

module.exports = router;
