const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  subject: { type: String, default: 'General' },
  fileType: { type: String, default: 'text' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Note', noteSchema);
