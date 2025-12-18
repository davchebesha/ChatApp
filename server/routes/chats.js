const express = require('express');
const router = express.Router();
const {
  getChats,
  createChat,
  updateChat,
  addParticipants,
  removeParticipant,
  togglePin,
  toggleArchive,
  deleteChat
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getChats);
router.post('/', protect, createChat);
router.put('/:id', protect, updateChat);
router.post('/:id/participants', protect, addParticipants);
router.delete('/:id/participants', protect, removeParticipant);
router.post('/:id/pin', protect, togglePin);
router.post('/:id/archive', protect, toggleArchive);
router.delete('/:id', protect, deleteChat);

module.exports = router;
