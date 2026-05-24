const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'] },
      content: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
