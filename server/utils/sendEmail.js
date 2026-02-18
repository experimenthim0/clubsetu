import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

// Load environment variables BEFORE importing modules that use them
dotenv.config();
const sendEmail = async (options) => {
  // Set SendGrid API Key dynamically to ensure process.env is loaded
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  } else {
    console.warn("SENDGRID_API_KEY is not set in environment variables.");
  }

  const msg = {
    to: options.email,
    from: `${process.env.EMAIL_FROM_NAME || "Club Event Support"} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`, // Use a verified sender email
    subject: options.subject,
    html: options.message,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${options.email}`);
  } catch (error) {
    console.error("Error sending email via SendGrid:", error);

    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};

export default sendEmail;
