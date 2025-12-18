const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  searchUsers,
  blockUser,
  unblockUser
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/search', protect, searchUsers);
router.get('/:id', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/block/:id', protect, blockUser);
router.delete('/block/:id', protect, unblockUser);

module.exports = router;
