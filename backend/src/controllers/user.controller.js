const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Fonction pour enregistrer un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    // Vérifie si l'email existe déjà
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email déjà utilisé" });

    // Hash du mot de passe
    const hash = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    const user = await User.create({
      firstname,
      lastname,
      email,
      password: hash
    });

    // Création d'un token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ user, token });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

