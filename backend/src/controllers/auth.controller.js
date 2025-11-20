const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationCode } = require('../services/emailService');

// Générer un code de vérification
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// --- FONCTIONS MFA AJOUTÉES ---
// Inscription avec envoi de code MFA
exports.registerWithMFA = async (req, res) => {
  try {
    const { nom, prenom, email, mdp, role } = req.body;

    // Vérifications manuelles supplémentaires
    if (!nom || !prenom || !email || !mdp) {
      return res.status(400).json({ 
        message: 'Tous les champs obligatoires doivent être remplis' 
      });
    }

    if (mdp.length < 8) {
      return res.status(400).json({ 
        message: 'Le mot de passe doit contenir au moins 8 caractères' 
      });
    }

    // Validation email basique
    const emailRegex = /^.+@.+\..+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Format d\'email invalide' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mdp, 12);

    // Générer le code de vérification
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Créer l'utilisateur (non vérifié)
    const user = new User({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.toLowerCase().trim(),
      mdp: hashedPassword,
      role: role || 'student',
      pdp: null,
      dateinscri: new Date(),
      statut: 'active',
      // Champs MFA
      isVerified: false,
      verificationCode,
      verificationCodeExpires
    });

    await user.save();

    // Envoyer le code par email - GESTION AMÉLIORÉE DES ERREURS
    let emailSent = false;
    try {
      emailSent = await sendVerificationCode(email, verificationCode);
      if (emailSent) {
        console.log('✅ Email envoyé avec succès à:', email);
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email:', emailError.message);
      emailSent = false;
    }
      
    // Dans registerWithMFA, remplace cette partie :
    

    // Toujours afficher le code dans la console pour le développement
    console.log('📧 Code de vérification pour', email, ':', verificationCode);

    res.status(201).json({
      message: emailSent 
        ? 'Compte créé. Un code de vérification a été envoyé à votre email.'
        : 'Compte créé. Vérifiez la console pour le code de vérification.',
      userId: user._id,
      email: user.email,
      emailSent: emailSent
    });

  } catch (error) {
    console.error('Erreur register MFA:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Erreur de validation',
        errors: errors 
      });
    }
    
    if (error.code === 121) {
      return res.status(400).json({ 
        message: 'Les données ne respectent pas le schéma de validation',
        error: error.errInfo?.details 
      });
    }

    res.status(500).json({ 
      message: 'Erreur lors de la création du compte',
      error: error.message 
    });
  }
};


// Vérifier le code MFA
exports.verifyMFA = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Vérifications de base
    if (!email || !code) {
      return res.status(400).json({ 
        message: 'Email et code sont requis' 
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      verificationCode: code,
      verificationCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Code invalide ou expiré' 
      });
    }

    // Marquer l'utilisateur comme vérifié
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    console.log('✅ Compte vérifié avec succès pour:', email);

    // Créer le token JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Compte vérifié avec succès!',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        statut: user.statut
      }
    });

  } catch (error) {
    console.error('Erreur vérification MFA:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la vérification',
      error: error.message 
    });
  }
};

// Renvoyer le code MFA
exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        message: 'Email est requis' 
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim(), 
      isVerified: false 
    });
    
    if (!user) {
      return res.status(400).json({ 
        message: 'Utilisateur non trouvé ou déjà vérifié' 
      });
    }

    // Générer un nouveau code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Envoyer le code par email
    let emailSent = false;
    try {
      emailSent = await sendVerificationCode(email, verificationCode);
      if (emailSent) {
        console.log('✅ Nouvel email envoyé à:', email);
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email:', emailError.message);
      emailSent = false;
    }

    // Toujours afficher le code dans la console
    console.log('📧 Nouveau code de vérification pour', email, ':', verificationCode);

    res.json({
      message: emailSent 
        ? 'Nouveau code de vérification envoyé'
        : 'Nouveau code généré. Vérifiez la console.',
      emailSent: emailSent
    });

  } catch (error) {
    console.error('Erreur renvoi code MFA:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'envoi du code',
      error: error.message 
    });
  }
};

// --- TES FONCTIONS EXISTANTES GARDÉES ---

exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, mdp, role } = req.body;

    // Vérifications manuelles supplémentaires
    if (!nom || !prenom || !email || !mdp) {
      return res.status(400).json({ 
        message: 'Tous les champs obligatoires doivent être remplis' 
      });
    }

    if (mdp.length < 8) {
      return res.status(400).json({ 
        message: 'Le mot de passe doit contenir au moins 8 caractères' 
      });
    }

    // Validation email basique
    const emailRegex = /^.+@.+\..+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Format d\'email invalide' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mdp, 12);

    // Créer le nouvel utilisateur avec TOUS les champs requis
    const user = new User({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.toLowerCase().trim(),
      mdp: hashedPassword,
      role: role || 'student',
      pdp: null, // Explicitement null comme dans le validateur
      dateinscri: new Date(), // Date actuelle
      statut: 'active' // Statut par défaut
    });

    await user.save();

    // Créer un token JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        statut: user.statut,
        dateinscri: user.dateinscri
      }
    });

  } catch (error) {
    console.error('Erreur register détaillée:', error);
    
    // Gestion spécifique des erreurs de validation MongoDB
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Erreur de validation',
        errors: errors 
      });
    }
    
    if (error.code === 121) { // Code d'erreur de validation MongoDB
      return res.status(400).json({ 
        message: 'Les données ne respectent pas le schéma de validation',
        error: error.errInfo?.details 
      });
    }

    res.status(500).json({ 
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, mdp } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(mdp, user.mdp);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier que le compte est actif
    if (user.statut !== 'active') {
      return res.status(400).json({ message: 'Votre compte est suspendu' });
    }

    // Vérifier que le compte est vérifié (pour MFA)
    if (!user.isVerified) {
      return res.status(400).json({ 
        message: 'Compte non vérifié. Veuillez vérifier votre email.' 
      });
    }

    // Créer un token JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        statut: user.statut
      }
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la connexion',
      error: error.message 
    });
  }
};