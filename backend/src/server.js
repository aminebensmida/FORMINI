<<<<<<< HEAD
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Connexion DB
connectDB();

// Démarrage serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
=======
require('dotenv').config(); // Charge les variables du .env
const app = require('./app');
const connectDB = require('./config/db');

// Connexion à MongoDB
connectDB();

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

>>>>>>> 5d150116560171cd5d6f9c8888f49233e447271c
