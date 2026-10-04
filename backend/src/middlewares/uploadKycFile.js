import multer from 'multer';
import { KYC_MAX_FILE_BYTES } from '../constants/kycDocuments.js';
import { ApiError } from '../utils/ApiError.js';

// Verification documents are held in memory just long enough to be checked and stored in the
// database (see KycFile) — nothing is written to disk. multer's own errors are turned into
// friendly messages instead of a generic 500.
const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: KYC_MAX_FILE_BYTES, files: 1 },
}).single('file');

export const uploadKycFile = (req, res, next) => {
  uploader(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest('That file is too large. Please upload a file under 4 MB.'));
    }
    return next(ApiError.badRequest('We couldn’t read that upload. Please try again with a PDF, JPG or PNG.'));
  });
};
