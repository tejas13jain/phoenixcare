import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { env } from './env.js';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'phoenixcare',
    resource_type: 'auto',
    public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
  }),
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export { cloudinary };
