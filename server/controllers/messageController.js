const Message = require('../models/Message');
const Chat = require('../models/Chat');

// Get messages for a chat
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      chat: chatId,
      deleted: false,
      deletedFor: { $ne: req.user._id }
    })
    .populate('sender', 'username avatar')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const count = await Message.countDocuments({ chat: chatId, deleted: false });

    res.json({
      success: true,
      messages: messages.reverse(),
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content, type, replyTo, forwardedFrom } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID required' });
    }

    if (!content && !req.file) {
      return res.status(400).json({ message: 'Message content or file required' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messageData = {
      chat: chatId,
      sender: req.user._id,
      content,
      type: type || 'text',
      replyTo,
      forwardedFrom
    };

    if (req.file) {
      messageData.file = {
        url: `/uploads/${req.file.filename}`,
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      };
    }

    const message = await Message.create(messageData);
    await message.populate('sender', 'username avatar');

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { deleteForEveryone } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (deleteForEveryone) {
      message.deleted = true;
      message.deletedAt = new Date();
      message.content = 'This message was deleted';
    } else {
      message.deletedFor.push(req.user._id);
    }

    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add reaction to message
exports.addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user already reacted
    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      existingReaction.emoji = emoji;
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search messages
exports.searchMessages = async (req, res) => {
  try {
    const { query, chatId } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query required' });
    }

    const searchFilter = {
      $text: { $search: query },
      deleted: false
    };

    if (chatId) {
      searchFilter.chat = chatId;
    }

    const messages = await Message.find(searchFilter)
      .populate('sender', 'username avatar')
      .populate('chat', 'name type')
      .limit(50);

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
