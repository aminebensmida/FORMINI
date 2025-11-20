const express = require('express');
const router = express.Router();

// CORRECTION : Chemin relatif correct
const userController = require('../controllers/user.controller');

// Route d'inscription
router.post('/register', userController.register);

// Route de connexion
router.post('/login', userController.login);

module.exports = router;