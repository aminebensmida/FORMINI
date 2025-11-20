const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Inscription avec MFA
router.post('/register-mfa', authController.registerWithMFA);

// Vérification MFA
router.post('/verify-mfa', authController.verifyMFA);

// Renvoyer le code
router.post('/resend-verification', authController.resendVerificationCode);

module.exports = router;