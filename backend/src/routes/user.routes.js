const express = require("express");
const router = express.Router();
const { register } = require("../controllers/user.controller");

// Route POST pour créer un utilisateur
router.post("/register", register);

module.exports = router; // ✅ Export correct

