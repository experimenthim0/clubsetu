import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { uploadImage } from "../utils/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CUSTOM_FONTS = {
  DancingScript: path.join(__dirname, "../assets/fonts/DancingScript.ttf"),
  GreatVibes: path.join(__dirname, "../assets/fonts/GreatVibes.ttf"),
  Pacifico: path.join(__dirname, "../assets/fonts/Pacifico.ttf"),
  Sacramento: path.join(__dirname, "../assets/fonts/Sacramento.ttf"),
  Allura: path.join(__dirname, "../assets/fonts/Allura.ttf"),
  PinyonScript: path.join(__dirname, "../assets/fonts/PinyonScript.ttf"),
};

/**
 * Generate and stream PDF certificate for a student
 */
export const downloadCertificate = async (req, res) => {
  const { eventId } = req.params;
  const studentId = req.user.userId; // From verifyToken middleware (using userId based on auth routes)

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const template = event.certificateTemplate;
    if (!template || !template.imageUrl) {
      return res.status(400).json({ message: "Certificate template not configured for this event." });
    }

    // Check if event ended
    if (new Date() < new Date(event.endTime)) {
      return res.status(400).json({ message: "Certificates are available only after the event ends." });
    }

    // Verify registration
    const registration = await Registration.findOne({ eventId, studentId, paymentStatus: "SUCCESS" }).populate("studentId");
    if (!registration) {
      return res.status(403).json({ message: "You are not registered for this event." });
    }

    const userName = registration.studentId.name;

    // Set headers for PDF download
    const safeFileName = userName.replace(/\s+/g, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}_Certificate.pdf"`);

    const n = template;
    const docSize = [n.imageWidth || 841.89, n.imageHeight || 595.28];

    const doc = new PDFDocument({ size: docSize });
    doc.pipe(res);

    // Load background image from Cloudinary
    try {
      const response = await fetch(template.imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      doc.image(buffer, 0, 0, { width: docSize[0], height: docSize[1] });
    } catch (imgError) {
      console.error("Image loading error:", imgError);
      // Fallback: draw a basic border if image fails
      doc.rect(20, 20, docSize[0]-40, docSize[1]-40).stroke();
    }

    // Register custom font if needed
    const fontSrc = CUSTOM_FONTS[n.font];
    if (fontSrc && fs.existsSync(fontSrc)) {
      doc.registerFont(n.font, fontSrc);
      doc.font(n.font);
    } else {
      // Fallback to a standard font
      doc.font("Helvetica-Bold");
    }

    doc.fontSize(n.fontSize);

    // Calculate vertical centering within the defined box
    const textHeight = doc.currentLineHeight(true);
    const boxH = n.nameHeight || textHeight;
    const centeredY = n.nameY + (boxH - textHeight) / 2;

    doc.fillColor(n.color)
       .text(userName, n.nameX, centeredY, { 
         width: n.nameWidth, 
         align: n.align, 
         lineBreak: false 
       });

    doc.end();
  } catch (error) {
    console.error("Certificate generation error:", error);
    res.status(500).json({ message: "Failed to generate certificate", error: error.message });
  }
};

/**
 * Save certificate template configuration
 */
export const saveTemplate = async (req, res) => {
  const { eventId } = req.params;
  const config = req.body;

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Authorization: Only the creator (clubHead) can update the template
    if (event.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized to update this event's template." });
    }

    event.certificateTemplate = {
      imageUrl:   config.imageUrl,
      nameX:      parseInt(config.nameX),
      nameY:      parseInt(config.nameY),
      nameWidth:  parseInt(config.nameWidth),
      nameHeight: parseInt(config.nameHeight),
      fontSize:   parseInt(config.fontSize) || 32,
      color:      config.color || "#000000",
      font:       config.font || "Helvetica-Bold",
      align:      config.align || "center",
      imageWidth: parseInt(config.imageWidth),
      imageHeight: parseInt(config.imageHeight),
    };

    await event.save();
    res.json({ success: true, message: "Certificate template saved successfully." });
  } catch (error) {
    console.error("Save template error:", error);
    res.status(500).json({ message: "Failed to save template", error: error.message });
  }
};

/**
 * Upload template image to Cloudinary (Proxy)
 * Avoids frontend CORS/Signed upload hurdles
 */
export const uploadTemplateProxy = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to 'certificates' folder in Cloudinary
    const result = await uploadImage(req.file.buffer, "certificates");
    
    res.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error("Template proxy upload error:", error);
    res.status(500).json({ message: "Failed to upload to Cloudinary via server", error: error.message });
  }
};
