const multer = require('multer');
const { ValidationError } = require('../utils/errors');

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new ValidationError('Only image files are allowed'));
  }

  cb(null, true);
};

const medicineImageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES
  }
});

module.exports = {
  medicineImageUpload
};
