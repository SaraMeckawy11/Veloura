import multer from 'multer';
import path from 'path';

// Store files in memory buffer, then upload to Cloudinary manually in the route
const storage = multer.memoryStorage();

const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tif', '.tiff',
  '.heic', '.heif', '.avif',
]);
const AUDIO_EXTENSIONS = new Set([
  '.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac', '.opus', '.weba',
]);

// Block obviously dangerous file types regardless of category.
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.dll', '.bat', '.cmd', '.com', '.scr', '.pif', '.msi',
  '.sh', '.ps1', '.app', '.jar', '.vbs', '.vbe', '.wsf', '.wsh',
  '.lnk', '.reg', '.html', '.htm', '.php', '.asp', '.aspx', '.jsp',
]);

// Android browsers — especially through the Google Photos picker — frequently
// hand the server a file with NO extension (e.g. "IMG_20231101_123456") and a
// mimetype of `application/octet-stream` or an empty string. Photos synced
// from iCloud via Google Photos come through as HEIC. None of those signals
// reliably identify the file, so we trust the client's category instead and
// let Cloudinary validate the actual bytes during upload (it will reject any
// truly non-image content). We still hard-block obvious dangerous extensions.
function isAcceptableUpload(req, file) {
  const category = (req.query?.category || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (DANGEROUS_EXTENSIONS.has(ext)) return false;

  if (category === 'music') {
    if (mime.startsWith('audio/')) return true;
    if (AUDIO_EXTENSIONS.has(ext)) return true;
    return false;
  }

  // Image upload category (gallery / story / venue / couple / default).
  if (mime.startsWith('image/')) return true;
  if (IMAGE_EXTENSIONS.has(ext)) return true;
  // Reject audio files mistakenly sent as photos.
  if (mime.startsWith('audio/') || AUDIO_EXTENSIONS.has(ext)) return false;
  // Unknown mimetype + unknown / missing extension — typical of the Android
  // Google Photos picker. Trust the client; Cloudinary will reject if the
  // bytes aren't a real image.
  return true;
}

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB — mobile photos can be large
  fileFilter(req, file, cb) {
    if (isAcceptableUpload(req, file)) {
      cb(null, true);
    } else {
      cb(new Error('That file type is not allowed.'));
    }
  },
});

export default upload;
