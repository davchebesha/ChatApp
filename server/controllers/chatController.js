const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Get all chats for user
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      archivedBy: { $ne: req.user._id }
    })
    .populate('participants', 'username avatar status lastSeen')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new chat (private or group)
exports.createChat = async (req, res) => {
  try {
    const { type, participants, name, description } = req.body;

    // Validate
    if (!participants || participants.length === 0) {
      return res.status(400).json({ message: 'Participants required' });
    }

    // Add creator to participants
    const allParticipants = [...new Set([req.user._id.toString(), ...participants])];

    // For private chat, check if already exists
    if (type === 'private' && allParticipants.length === 2) {
      const existingChat = await Chat.findOne({
        type: 'private',
        participants: { $all: allParticipants, $size: 2 }
      });

      if (existingChat) {
        return res.json({
          success: true,
          chat: existingChat
        });
      }
    }

    // Create chat
    const chat = await Chat.create({
      type: type || 'private',
      name,
      description,
      participants: allParticipants,
      creator: req.user._id,
      admins: type === 'group' || type === 'channel' ? [req.user._id] : []
    });

    await chat.populate('participants', 'username avatar status');

    res.status(201).json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update chat
exports.updateChat = async (req, res) => {
  try {
    const { name, description, avatar } = req.body;
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is admin
    if (!chat.admins.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (name) chat.name = name;
    if (description !== undefined) chat.description = description;
    if (avatar) chat.avatar = avatar;

    await chat.save();

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add participants to group
exports.addParticipants = async (req, res) => {
  try {
    const { participants } = req.body;
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is admin
    if (!chat.admins.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add new participants
    participants.forEach(userId => {
      if (!chat.participants.includes(userId)) {
        chat.participants.push(userId);
      }
    });

    await chat.save();

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Add participants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove participant from group
exports.removeParticipant = async (req, res) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is admin
    if (!chat.admins.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    chat.participants = chat.participants.filter(id => id.toString() !== userId);
    await chat.save();

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Pin/Unpin chat
exports.togglePin = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const isPinned = chat.pinnedBy.includes(req.user._id);
    
    if (isPinned) {
      chat.pinnedBy = chat.pinnedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      chat.pinnedBy.push(req.user._id);
    }

    await chat.save();

    res.json({
      success: true,
      pinned: !isPinned
    });
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Archive/Unarchive chat
exports.toggleArchive = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const isArchived = chat.archivedBy.includes(req.user._id);
    
    if (isArchived) {
      chat.archivedBy = chat.archivedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      chat.archivedBy.push(req.user._id);
    }

    await chat.save();

    res.json({
      success: true,
      archived: !isArchived
    });
  } catch (error) {
    console.error('Toggle archive error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete chat
exports.deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Only creator can delete
    if (chat.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete all messages in chat
    await Message.deleteMany({ chat: chat._id });
    
    // Delete chat
    await chat.deleteOne();

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
