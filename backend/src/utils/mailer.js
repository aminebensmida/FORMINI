const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false, // Gmail utilise STARTTLS sur 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Mot de passe d'application Gmail
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Envoie un email
 */
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Formini" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html
    });

    console.log("📨 Email envoyé :", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Erreur email :", error.message);
    return false; // Ne bloque jamais l'app
  }
};

/**
 * Envoie un code MFA
 */
exports.sendVerificationCode = async (email, code) => {
  const html = `
    <h2>Votre code Formini</h2>
    <p>Voici votre code de vérification :</p>
    <div style="
      font-size: 32px;
      background:#ef7212;
      color:white;
      padding:15px;
      width:200px;
      text-align:center;
      border-radius:10px;
    ">
      ${code}
    </div>
    <p>Ce code expire dans 10 minutes.</p>
  `;

  return sendEmail(email, "Votre code de vérification", html);
};
