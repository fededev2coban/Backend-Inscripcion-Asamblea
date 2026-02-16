const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogoController');
const { authMiddleware } = require('../middleware/auth');

// Rutas públicas (para formulario público)
router.get('/comisiones', catalogoController.getComisiones);
router.get('/puestos', catalogoController.getPuestos);

// Rutas protegidas (admin)
router.post('/comisiones', authMiddleware, catalogoController.createComision);
router.post('/puestos', authMiddleware, catalogoController.createPuesto);

module.exports = router;
