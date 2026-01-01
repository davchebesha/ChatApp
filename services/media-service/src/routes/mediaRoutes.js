const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
const pino = require('pino');
const File = require('../models/File');
const { publishEvent } = require('../utils/rabbitmq');

const logger = pino();
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const dateFolder = new Date().toISOString().split('T')[0];
    const fullPath = path.join(uploadPath, dateFolder);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default
    files: 10 // Max 10 files per request
  }
});

// Helper function to determine file type
const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('text')) return 'document';
  return 'other';
};

// Helper function to generate thumbnail for images
const generateThumbnail = async (filePath, mimeType) => {
  if (!mimeType.startsWith('image/')) return null;
  
  try {
    const thumbnailPath = filePath.replace(path.extname(filePath), '_thumb.jpg');
    await sharp(filePath)
      .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  } catch (error) {
    logger.error('Error generating thumbnail:', error);
    return null;
  }
};

// Upload single file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    const { chatId, messageId } = req.body;
    const userId = req.headers['x-user-id']; // Would come from auth middleware

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required'
      });
    }

    const fileType = getFileType(req.file.mimetype);
    const fileUrl = `/uploads/${path.basename(path.dirname(req.file.path))}/${req.file.filename}`;

    // Generate thumbnail for images
    const thumbnailPath = await generateThumbnail(req.file.path, req.file.mimetype);
    const thumbnailUrl = thumbnailPath ? `/uploads/${path.basename(path.dirname(thumbnailPath))}/${path.basename(thumbnailPath)}` : null;

    // Get image dimensions for images
    let metadata = {};
    if (fileType === 'image') {
      try {
        const imageInfo = await sharp(req.file.path).metadata();
        metadata.width = imag