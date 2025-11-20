<<<<<<< HEAD
const express = require('express');
const router = express.Router();

// CORRECTION : Chemin relatif correct
const userController = require('../controllers/user.controller');

// Route d'inscription
router.post('/register', userController.register);

// Route de connexion
router.post('/login', userController.login);

module.exports = router;
=======
const express = require("express");
const router = express.Router();
const { register } = require("../controllers/user.controller");

// Route POST pour créer un utilisateur
router.post("/register", register);

module.exports = router; // ✅ Export correct

>>>>>>> 5d150116560171cd5d6f9c8888f49233e447271c
