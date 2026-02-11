const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const { eventoValidation } = require('../middleware/validators/eventoValidator');

/**
 * @route   GET /api/eventos
 * @desc    Obtener todos los eventos
 * @access  Public
 */
router.get('/', eventoController.getAll);

/**
 * @route   GET /api/eventos/activos
 * @desc    Obtener eventos activos
 * @access  Public
 */
router.get('/activos', eventoController.getActive);

/**
 * @route   GET /api/eventos/proximos
 * @desc    Obtener eventos próximos
 * @access  Public
 */
router.get('/proximos', eventoController.getUpcoming);

/**
 * @route   GET /api/eventos/:id
 * @desc    Obtener evento por ID
 * @access  Public
 */
router.get('/:id', eventoValidation.getById, eventoController.getById);

/**
 * @route   POST /api/eventos
 * @desc    Crear nuevo evento
 * @access  Public
 */
router.post('/', eventoValidation.create, eventoController.create);

/**
 * @route   PUT /api/eventos/:id
 * @desc    Actualizar evento
 * @access  Public
 */
router.put('/:id', eventoValidation.update, eventoController.update);

/**
 * @route   DELETE /api/eventos/:id
 * @desc    Eliminar evento
 * @access  Public
 */
router.delete('/:id', eventoValidation.getById, eventoController.delete);

module.exports = router;
