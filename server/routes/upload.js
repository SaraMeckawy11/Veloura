import { Router } from 'express';
import upload from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';

const router = Router();

// Helper: upload buffer to Cloudinary
function uploadToCloudinary(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'eternally/uploads',
        transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto' }],
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
router.post('/', upload.array('photos', 5), async (req, res) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploads = await Promise.all(
      req.files.map(file => uploadToCloudinary(file.buffer))
    );

    const files = uploads.map(result => ({
      url: result.secure_url,
      publicId: result.public_id,
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
