import { v2 as cloudinary } from 'cloudinary';

// Configuration will use CLOUDINARY_URL from .env if available, 
// or individual keys if provided separately.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export const generateSignature = (params) => {
  return cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
};

export const uploadImage = (fileBuffer, folder = 'certificates') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Stream Error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
