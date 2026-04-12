import multer from 'multer';

// Store files in memory buffer, then upload to Cloudinary manually in the route
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB — mobile photos can be large
  fileFilter(req, file, cb) {
    // Accept any image type — Cloudinary handles conversion/optimization
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export default upload;
