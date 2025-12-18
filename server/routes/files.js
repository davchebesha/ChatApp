const express = require('express');
const router = express.Router();
const { uploadFile, downloadFile, deleteFile } = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload', protect, upload.single('file'), uploadFile);
router.get('/:filename', protect, downloadFile);
router.delete('/:filename', protect, deleteFile);

module.exports = router;
