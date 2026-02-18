import dotenv from "dotenv";

// Load environment variables BEFORE importing modules that use them
dotenv.config();

// Dynamic import to ensure env vars are loaded
const { default: sendEmail } = await import("../utils/sendEmail.js");

const testEmail = async () => {
  const recipientEmail = "contact.nikhim@gmail.com"; // Replace with your email for testing

  console.log(`Attempting to send test email to ${recipientEmail}...`);
  console.log(
    `Using API Key: ${process.env.SENDGRID_API_KEY ? "Loaded" : "MISSING"}`,
  );
  console.log(
    `From Email: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}`,
  );

  try {
    await sendEmail({
      email: recipientEmail,
      subject: "Test Email from ClubSetu (SendGrid)",
      message: `
        <h1>It Works!</h1>
        <p>This is a test email sent using SendGrid integration.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `,
    });
    console.log("✅ Test email sent successfully!");
  } catch (error) {
    console.error("❌ Failed to send test email.");
    console.error(error);
  }
};

testEmail();
