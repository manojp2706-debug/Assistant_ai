const express = require('express');
const Groq = require('groq-sdk');
const Note = require('../models/Note');
const ChatHistory = require('../models/ChatHistory');
const auth = require('../middleware/auth');
const router = express.Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

const truncate = (text, max = 6000) => (text.length > max ? text.slice(0, max) + '...' : text);

const chat = (messages, max_tokens = 800) =>
  groq.chat.completions.create({ model: MODEL, messages, max_tokens });

// Chat with a note
router.post('/chat/:noteId', auth, async (req, res) => {
  const { message } = req.body;
  const note = await Note.findOne({ _id: req.params.noteId, userId: req.userId });
  if (!note) return res.status(404).json({ message: 'Note not found' });

  let history = await ChatHistory.findOne({ userId: req.userId, noteId: note._id });
  if (!history) {
    history = await ChatHistory.create({ userId: req.userId, noteId: note._id, messages: [] });
  }

  const systemPrompt = `You are a helpful AI tutor. Answer questions ONLY based on the following study material. Be concise and clear.\n\nMATERIAL:\n${truncate(note.content)}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const completion = await chat(messages, 800);
  const reply = completion.choices[0].message.content;

  history.messages.push({ role: 'user', content: message });
  history.messages.push({ role: 'assistant', content: reply });
  history.updatedAt = new Date();
  await history.save();

  res.json({ reply, chatId: history._id });
});

// Get chat history
router.get('/chat/:noteId', auth, async (req, res) => {
  const history = await ChatHistory.findOne({ userId: req.userId, noteId: req.params.noteId });
  res.json(history?.messages || []);
});

// Clear chat history
router.delete('/chat/:noteId', auth, async (req, res) => {
  await ChatHistory.findOneAndDelete({ userId: req.userId, noteId: req.params.noteId });
  res.json({ message: 'Chat cleared' });
});

// Summarize
router.post('/summarize/:noteId', auth, async (req, res) => {
  const { mode = 'short' } = req.body;
  const note = await Note.findOne({ _id: req.params.noteId, userId: req.userId });
  if (!note) return res.status(404).json({ message: 'Note not found' });

  const modePrompts = {
    short: 'Give a short 3-5 sentence summary.',
    detailed: 'Give a detailed summary covering all key points.',
    bullets: 'Summarize as bullet points with key takeaways.',
    exam: 'Create an exam revision summary with key definitions, formulas, and important points.',
  };

  const completion = await chat([
    { role: 'system', content: `You are a study assistant. ${modePrompts[mode] || modePrompts.short}` },
    { role: 'user', content: `Summarize this:\n\n${truncate(note.content)}` },
  ], 1000);

  res.json({ summary: completion.choices[0].message.content });
});

// Flashcards
router.post('/flashcards/:noteId', auth, async (req, res) => {
  const note = await Note.findOne({ _id: req.params.noteId, userId: req.userId });
  if (!note) return res.status(404).json({ message: 'Note not found' });

  const completion = await chat([
    {
      role: 'system',
      content: 'Generate 8 flashcards from the study material. Return ONLY a valid JSON object like: {"flashcards": [{"front": "question", "back": "answer"}]}. No extra text or markdown.',
    },
    { role: 'user', content: truncate(note.content) },
  ], 1200);

  const raw = completion.choices[0].message.content.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch[0]);
  const flashcards = parsed.flashcards || parsed.cards || Object.values(parsed)[0];

  res.json({ flashcards });
});

// Quiz
router.post('/quiz/:noteId', auth, async (req, res) => {
  const note = await Note.findOne({ _id: req.params.noteId, userId: req.userId });
  if (!note) return res.status(404).json({ message: 'Note not found' });

  const completion = await chat([
    {
      role: 'system',
      content: 'Generate 5 multiple choice quiz questions from the study material. Return ONLY a valid JSON object like: {"questions": [{"question": "...", "options": ["A","B","C","D"], "answer": "A", "explanation": "..."}]}. No extra text or markdown.',
    },
    { role: 'user', content: truncate(note.content) },
  ], 1500);

  const raw = completion.choices[0].message.content.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch[0]);

  res.json({ questions: parsed.questions });
});

module.exports = router;
