<<<<<<< HEAD
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  // Ajout temporaire pour résoudre le conflit d'index
  username: {
    type: String,
    unique: true,
    sparse: true // Permet les valeurs null uniques
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^.+@.+\..+$/, 'Veuillez entrer un email valide']
  },
  mdp: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  pdp: {
    type: String,
    default: null
  },
  dateinscri: {
    type: Date,
    default: Date.now,
    required: true
  },
  statut: {
    type: String,
    enum: ['active', 'suspendue'],
    default: 'active'
  },
  
  // --- CHAMPS MFA AJOUTÉS ---
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationCodeExpires: {
    type: Date,
    default: null
  },
  mfaEnabled: {
    type: Boolean,
    default: true // Active MFA par défaut
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Méthode pour vérifier si le compte est verrouillé
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Méthode pour incrémenter les tentatives de connexion
userSchema.methods.incrementLoginAttempts = function() {
  // Si le verrou a expiré, réinitialiser
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Sinon, incrémenter
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Verrouiller le compte après 5 tentatives échouées pendant 30 minutes
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 minutes
  }
  
  return this.updateOne(updates);
};

// Méthode pour réinitialiser les tentatives de connexion
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', userSchema);
=======

>>>>>>> 5d150116560171cd5d6f9c8888f49233e447271c
