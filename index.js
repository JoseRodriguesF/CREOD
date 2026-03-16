require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Servir arquivos estáticos PRIMEIRO
app.use(express.static(path.join(__dirname, 'public')));

// 2. Health Check
app.get('/api/ping', (req, res) => res.send('pong'));

// 3. Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(morgan('dev'));

// Configuração do Passport (precisa vir DEPOIS dos middlewares básicos)
require('./passport-config');

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

app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.set('bufferCommands', false); // Desativa o buffering global

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI não encontrada.');
    return;
  }
  
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    isConnected = db.connections[0].readyState;
    console.log('✅ Conectado ao MongoDB Atlas');
  } catch (err) {
    console.error('❌ Erro MongoDB:', err.message);
  }
};

// Middleware para garantir conexão em cada request (útil na Vercel)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// 4. Rotas de API
const unitRoutes = require('./routes/unitRoutes');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');

app.use('/api/units', unitRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// 5. Fallback para o SPA (Frontend)
app.get('*', (req, res, next) => {
  // Se for uma requisição de arquivo (tem ponto), deixa passar para o 404
  if (req.path.includes('.') || req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server (somente local)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
