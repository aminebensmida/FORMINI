const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    const user = await User.findOne({ email });
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
    res.status(500).json({ 
      message: 'Erreur lors de la connexion',
      error: error.message 
    });
  }
};