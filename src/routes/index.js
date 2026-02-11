const express = require('express');
const router = express.Router();

const cooperativaRoutes = require('./cooperativaRoutes');
const eventoRoutes = require('./eventoRoutes');
const personaRoutes = require('./personaRoutes');
const registroEventoRoutes = require('./registroEventoRoutes');

// Rutas base
router.use('/cooperativas', cooperativaRoutes);
router.use('/eventos', eventoRoutes);
router.use('/personas', personaRoutes);
router.use('/registros', registroEventoRoutes);

// Ruta de health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
