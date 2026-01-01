const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

// Upload file
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { chatId, type, metadata } = req.body;
    
    // Create file message
    const fileData = {
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    };

    if (chatId) {
      // Create message with file
      const message = new Message({
        sender: req.user._id,
        chat: chatId,
        type: type || (req.file.mimetype.startsWith('image/') ? 'image' : 
               req.file.mimetype.startsWith('video/') ? 'video' :
               req.file.mimetype.startsWith('audio/') ? 'audio' : 'file'),
        file: fileData,
        metadata: metadata ? JSON.parse(metadata) : undefined,
        content: req.body.content || ''
      });

      await message.save();
      await message.populate('sender', 'username avatar');

      // Update chat's last message
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
        updatedAt: new Date()
      });

      // Emit to socket (you'll need to implement this in your socket handler)
      const io = req.app.get('io');
      if (io) {
        io.to(chatId).emit('new_message', message);
      }
    }

    res.json({
      success: true,
      file: fileData,
      message: chatId ? 'File uploaded and message sent' : 'File uploaded'
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
