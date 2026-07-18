import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../auth';
import { storageService } from '../services/storage.service';
import { Logger } from '../services/logger.service';
import { config } from '../config';

const router = Router();

// Configure multer to store files in memory before uploading to R2
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit for direct backend uploads
  },
});

/**
 * Endpoint to upload small files (like images, thumbnails) directly through the backend
 */
router.post('/image', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const ext = req.file.originalname.split('.').pop();
    const key = `uploads/images/${uuidv4()}.${ext}`;

    const url = await storageService.uploadFile(key, req.file.buffer, req.file.mimetype);

    res.json({
      message: 'File uploaded successfully',
      url,
      key,
    });
  } catch (error: any) {
    Logger.error('Image upload failed:', error);
    res.status(500).json({ message: 'Failed to upload image.', error: error.message });
  }
});

/**
 * Endpoint to generate a pre-signed URL for direct-to-R2 uploads
 * (Ideal for large files like videos or heavy PDFs)
 */
import * as fs from 'fs';

router.post('/presigned-url', async (req, res) => {
  try {
    const { filename, contentType, type = 'videos' } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ message: 'Filename and contentType are required.' });
    }

    // Generate a unique key to prevent overwriting
    const ext = filename.split('.').pop();
    const key = `uploads/${type}/${uuidv4()}.${ext}`;

    const uploadUrl = await storageService.generatePresignedUploadUrl(key, contentType);
    const fileUrl = config.r2PublicUrl ? `${config.r2PublicUrl}/${key}` : `https://pub-07312e7d5db0441abe8611dce8ea1437.r2.dev/${key}`;

    res.json({
      uploadUrl,
      fileUrl,
      key,
      filename,
    });
  } catch (error: any) {
    fs.writeFileSync('error.log', String(error.stack || error.message));
    Logger.error('Failed to generate presigned URL:', error);
    res.status(500).json({ message: 'Failed to generate upload URL.', error: String(error.stack || error.message) });
  }
});

export const uploadRoutes = router;
