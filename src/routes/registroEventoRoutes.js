const express = require('express');
const router = express.Router();
const registroEventoController = require('../controllers/registroEventoController');
const { registroEventoValidation } = require('../middleware/validators/registroEventoValidator');

/**
 * @route   GET /api/registros
 * @desc    Obtener todos los registros
 * @access  Public
 */
router.get('/', registroEventoController.getAll);

/**
 * @route   GET /api/registros/:id
 * @desc    Obtener registro por ID
 * @access  Public
 */
router.get('/:id', registroEventoValidation.getById, registroEventoController.getById);

/**
 * @route   GET /api/registros/evento/:id_evento
 * @desc    Obtener registros de un evento
 * @access  Public
 */
router.get('/evento/:id_evento', registroEventoValidation.getByEvento, registroEventoController.getByEvento);

/**
 * @route   GET /api/registros/evento/:id_evento/stats
 * @desc    Obtener estadísticas de un evento
 * @access  Public
 */
router.get('/evento/:id_evento/stats', registroEventoValidation.getByEvento, registroEventoController.getEventoStats);

/**
 * @route   GET /api/registros/persona/:id_persona
 * @desc    Obtener registros de una persona
 * @access  Public
 */
router.get('/persona/:id_persona', registroEventoValidation.getByPersona, registroEventoController.getByPersona);

/**
 * @route   POST /api/registros
 * @desc    Crear nuevo registro (inscribir persona a evento)
 * @access  Public
 */
router.post('/', registroEventoValidation.create, registroEventoController.create);

/**
 * @route   DELETE /api/registros/:id
 * @desc    Eliminar registro (cancelar inscripción)
 * @access  Public
 */
router.delete('/:id', registroEventoValidation.getById, registroEventoController.delete);

module.exports = router;
