// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

// Configuration SMTP avec gestion d'erreur avancée
const createTransporter = () => {
  // Si pas de configuration SMTP, utiliser le mode console
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️  Mode console activé - Configuration SMTP manquante');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true pour 465, false pour 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Options de robustesse
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    // Désactiver la validation TLS pour certains réseaux
    tls: {
      rejectUnauthorized: false
    }
  });
};

exports.sendVerificationCode = async (email, code) => {
  // AFFICHAGE DU CODE DANS TOUS LES CAS
  console.log('\n' + '🔐'.repeat(20));
  console.log('🎯 CODE MFA POUR ' + email);
  console.log('🔐 ' + code);
  console.log('⏱️  Valable 10 minutes');
  console.log('🔐'.repeat(20) + '\n');

  // Tentative d'envoi par email SI la configuration existe
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('💡 Conseil: Configure SMTP dans le fichier .env');
    return true;
  }

  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      return true; // Mode console
    }

    // Tester la connexion
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie');

    const mailOptions = {
      from: `Formini <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: 'Formini - Code de Vérification MFA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; background: #f97316; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">📚 Formini</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Vérification de compte</p>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #1f2937;">Code de Vérification</h2>
            <p>Bonjour,</p>
            <p>Utilisez le code suivant pour vérifier votre compte Formini :</p>
            
            <div style="background: #f97316; color: white; padding: 25px; text-align: center; font-size: 32px; font-weight: bold; border-radius: 10px; margin: 30px 0; letter-spacing: 8px; font-family: monospace;">
              ${code}
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              ⏱️ Ce code expirera dans 10 minutes.<br>
              🔒 Ne partagez pas ce code avec qui que ce soit.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e0e0e0; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>Formini Platform - Votre plateforme d'apprentissage</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès à: ' + email);
    console.log('📨 ID du message: ' + info.messageId);
    return true;
    
  } catch (error) {
    console.log('❌ Échec envoi email: ' + error.message);
    console.log('💡 Le code est affiché ci-dessus - Utilisez-le pour tester');
    
    // IMPORTANT: Toujours retourner true pour ne pas bloquer l'application
    return true;
  }
};