const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { authMiddleware } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Generar reporte Excel de asistencia
router.get('/asistencia/:id_evento/excel', reporteController.generarExcel);

// Generar reporte PDF de asistencia
router.get('/asistencia/:id_evento/pdf', reporteController.generarPDF);

module.exports = router;
