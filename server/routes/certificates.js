import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/auth.js";
import { 
  downloadCertificate, 
  saveTemplate, 
  uploadTemplateProxy 
} from "../controllers/certificateController.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new Error("Only jpeg, png, and webp images are allowed."), false);
  },
});

// All certificate routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/certificates/:eventId/template
 * @desc    Save certificate template configuration (ClubHead only)
 */
router.post("/:eventId/template", saveTemplate);

/**
 * @route   POST /api/certificates/upload-template
 * @desc    Proxy to upload image to Cloudinary (ClubHead only)
 */
router.post("/upload-template", upload.single("file"), uploadTemplateProxy);

/**
 * @route   GET /api/certificates/:eventId/download
 * @desc    Generate and download student's certificate
 */
router.get("/:eventId/download", downloadCertificate);

export default router;
