const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  toggleReaction,
  searchMessages
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/search', protect, searchMessages);
router.get('/:chatId', protect, getMessages);
router.post('/', protect, upload.single('file'), sendMessage);
router.put('/:id', protect, editMessage);
router.delete('/:id', protect, deleteMessage);
router.post('/:id/reaction', protect, addReaction);
router.post('/:id/toggle-reaction', protect, toggleReaction);

module.exports = router;
