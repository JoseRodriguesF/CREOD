require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');

// Import passport config
require(path.join(__dirname, 'passport-config'));

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Session config
app.use(session({
  secret: process.env.SESSION_SECRET || 'creod-fallback-secret-key-123',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' } 
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI não encontrada. O banco de dados não será conectado.');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB Atlas');
  } catch (err) {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
  }
};
connectDB();

// Routes
const unitRoutes = require(path.join(__dirname, 'routes', 'unitRoutes'));
const authRoutes = require(path.join(__dirname, 'routes', 'authRoutes'));
const noteRoutes = require(path.join(__dirname, 'routes', 'noteRoutes'));

app.use('/api/units', unitRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// Servir o frontend (opcional se express.static for suficiente, mas ajuda no roteamento)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
