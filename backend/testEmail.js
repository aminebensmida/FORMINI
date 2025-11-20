require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmail() {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.verify();
    console.log("✅ SMTP connecté.");

    const info = await transporter.sendMail({
      from: `"Test App" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: "Test Email",
      text: "Email fonctionnel !",
    });

    console.log("📨 Email envoyé :", info.messageId);

  } catch (err) {
    console.error("❌ ERREUR SMTP :", err);
  }
}

testEmail();
