const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  chatId: {
    type: String,
    required: false
  },
  messageId: {
    type: String,
    required: false
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'audio', 'document', 'other'],
    required: true
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number,
    thumbnail: String
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ chatId: 1, createdAt: -1 });
fileSchema.index({ fileType: 1 });
fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('File', fileSchema);