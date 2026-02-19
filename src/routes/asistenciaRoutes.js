const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');
const { authMiddleware } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Marcar asistencia individual
router.post('/:id/marcar', asistenciaController.marcarAsistencia);

// Marcar asistencia masiva
router.post('/masiva', asistenciaController.marcarAsistenciaMasiva);

// Obtener lista de asistencia de un evento
router.get('/evento/:id_evento', asistenciaController.getAsistenciaEvento);

// Obtener bitácora de un registro
router.get('/:id/bitacora', asistenciaController.getBitacora);

module.exports = router;
