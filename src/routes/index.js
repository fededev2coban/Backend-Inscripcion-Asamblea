const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// Rutas públicas (sin autenticación)
const publicRoutes = require('./publicRoutes');
const authRoutes = require('./authRoutes');
const catalogoRoutes = require('./catalogoRoutes');

// Rutas protegidas (requieren autenticación)
const cooperativaRoutes = require('./cooperativaRoutes');
const eventoRoutes = require('./eventoRoutes');
const personaRoutes = require('./personaRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const rolRoutes = require('./rolRoutes');
const registroEventoRoutes = require('./registroEventoRoutes');
const asistenciaRoutes = require('./asistenciaRoutes');
const reporteRoutes = require('./reporteRoutes');

// ===== RUTAS PÚBLICAS =====
router.use('/public', publicRoutes);
router.use('/auth', authRoutes);
router.use('/catalogos', catalogoRoutes);

// ===== RUTAS PROTEGIDAS =====
// Aplicar middleware de autenticación a todas las rutas protegidas
router.use('/cooperativas', authMiddleware, cooperativaRoutes);
router.use('/eventos', eventoRoutes); // Ya tiene authMiddleware en cada ruta
router.use('/personas', authMiddleware, personaRoutes);
router.use('/usuarios', authMiddleware, usuarioRoutes);
router.use('/roles', authMiddleware, rolRoutes);
router.use('/registros', authMiddleware, registroEventoRoutes);
router.use('/asistencia', asistenciaRoutes);
router.use('/reportes', reporteRoutes);

// Ruta de health check (pública)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    authenticated: false
  });
});

// Ruta de health check autenticada
router.get('/health/auth', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente - Usuario autenticado',
    timestamp: new Date().toISOString(),
    authenticated: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      rol: req.user.rol
    }
  });
});

module.exports = router;
