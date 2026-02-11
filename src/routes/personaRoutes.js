const express = require('express');
const router = express.Router();
const personaController = require('../controllers/personaController');
const { personaValidation } = require('../middleware/validators/personaValidator');

/**
 * @route   GET /api/personas
 * @desc    Obtener todas las personas
 * @access  Public
 */
router.get('/', personaController.getAll);

/**
 * @route   GET /api/personas/:id
 * @desc    Obtener persona por ID
 * @access  Public
 */
router.get('/:id', personaValidation.getById, personaController.getById);

/**
 * @route   GET /api/personas/dpi/:dpi
 * @desc    Buscar persona por DPI
 * @access  Public
 */
router.get('/dpi/:dpi', personaController.searchByDpi);

/**
 * @route   GET /api/personas/cooperativa/:id_cooperativa
 * @desc    Obtener personas de una cooperativa
 * @access  Public
 */
router.get('/cooperativa/:id_cooperativa', personaController.getByCooperativa);

/**
 * @route   POST /api/personas
 * @desc    Crear nueva persona
 * @access  Public
 */
router.post('/', personaValidation.create, personaController.create);

/**
 * @route   PUT /api/personas/:id
 * @desc    Actualizar persona
 * @access  Public
 */
router.put('/:id', personaValidation.update, personaController.update);

/**
 * @route   DELETE /api/personas/:id
 * @desc    Eliminar persona
 * @access  Public
 */
router.delete('/:id', personaValidation.getById, personaController.delete);

module.exports = router;
