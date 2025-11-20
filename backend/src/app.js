const express = require('express');
const cors = require('cors');

const app = express();

// Middleware pour accepter les requêtes JSON et le CORS
app.use(cors());
app.use(express.json());

// Routes utilisateurs
app.use('/api/users', require('./routes/user.routes'));

// Routes d'authentification MFA
app.use('/api/auth', require('./routes/auth.routes'));
// Route test
app.get('/', (req, res) => {
  res.send('Formini API Running ✅');
});

module.exports = app;

