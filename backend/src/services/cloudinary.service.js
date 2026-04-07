const cloudinary = require('cloudinary').v2;
const { getEnv } = require('../config/env');
const { AppError } = require('../utils/errors');

const CLOUDINARY_CLOUD_NAME = getEnv('CLOUDINARY_CLOUD_NAME');
const CLOUDINARY_API_KEY = getEnv('CLOUDINARY_API_KEY');
const CLOUDINARY_API_SECRET = getEnv('CLOUDINARY_API_SECRET');
const CLOUDINARY_FOLDER = getEnv('CLOUDINARY_FOLDER', 'med-broker/medicines');
const CLOUDINARY_PRESCRIPTION_FOLDER = getEnv('CLOUDINARY_PRESCRIPTION_FOLDER', 'med-broker/prescriptions');

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
}

const ensureCloudinaryConfigured = () => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new AppError('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.', 500);
  }
};

const bufferToDataUri = (buffer, mimeType) => {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

const uploadMedicineImage = async (fileBuffer, mimeType, inventoryId) => {
  ensureCloudinaryConfigured();

  const uploadResult = await cloudinary.uploader.upload(
    bufferToDataUri(fileBuffer, mimeType),
    {
      folder: CLOUDINARY_FOLDER,
      resource_type: 'image',
      public_id: `inventory-${inventoryId}-${Date.now()}`,
      overwrite: true
    }
  );

  return uploadResult.secure_url;
};

const uploadPrescriptionImage = async (fileBuffer, mimeType, userId) => {
  ensureCloudinaryConfigured();

  const uploadResult = await cloudinary.uploader.upload(
    bufferToDataUri(fileBuffer, mimeType),
    {
      folder: CLOUDINARY_PRESCRIPTION_FOLDER,
      resource_type: 'image',
      public_id: `prescription-${userId}-${Date.now()}`,
      overwrite: true
    }
  );

  return uploadResult.secure_url;
};

module.exports = {
  uploadMedicineImage,
  uploadPrescriptionImage
};
