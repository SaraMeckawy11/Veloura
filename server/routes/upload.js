import { Router } from 'express';
import multer from 'multer';
import upload from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';

const router = Router();

// Helper: upload buffer to Cloudinary
function uploadToCloudinary(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'veloura/uploads',
        resource_type: 'image',
        transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

// POST /api/upload — upload one or more images
// Accepts optional query param ?category=couple|venue|story|gallery
router.post('/', (req, res, next) => {
  // Wrap multer to catch file filter / size errors and return proper JSON
  upload.array('photos', 10)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File is too large. Maximum size is 25 MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const category = req.query.category || req.body.category || 'gallery';

    const uploads = await Promise.all(
      req.files.map(file => uploadToCloudinary(file.buffer, {
        folder: `veloura/uploads/${category}`,
      }))
    );

    const files = uploads.map(result => ({
      url: result.secure_url,
      publicId: result.public_id,
      label: category,
    }));

    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/upload/:publicId — delete an image from Cloudinary
router.delete('/:publicId(*)', async (req, res) => {
  try {
    const result = await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
