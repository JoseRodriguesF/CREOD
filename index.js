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
require('./passport-config');

const app = express();
const PORT = process.env.PORT || 5000;

// Health Check (Antes de qualquer middleware)
app.get('/api/ping', (req, res) => res.send('pong'));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(morgan('dev'));

// Session config
app.use(session({
  secret: process.env.SESSION_SECRET || 'creod-fallback-secret-key-123',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI não encontrada.');
    return;
  }
  try {
    // Definimos um timeout curto para evitar travar o boot da Vercel
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Conectado ao MongoDB Atlas');
  } catch (err) {
    console.error('❌ Erro MongoDB:', err.message);
  }
};
connectDB();

// Routes
const unitRoutes = require('./routes/unitRoutes');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');

app.use('/api/units', unitRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Fallback para o Frontend
app.get('*', (req, res, next) => {
  // Se for uma rota de API que não existe, deixa passar para o handler de 404/erro
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server (somente local)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
