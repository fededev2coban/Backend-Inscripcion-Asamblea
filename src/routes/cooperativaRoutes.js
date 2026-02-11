const express = require('express');
const router = express.Router();
const cooperativaController = require('../controllers/cooperativaController');
const { cooperativaValidation } = require('../middleware/validators/cooperativaValidator');

/**
 * @route   GET /api/cooperativas
 * @desc    Obtener todas las cooperativas
 * @access  Public
 */
router.get('/', cooperativaController.getAll);

/**
 * @route   GET /api/cooperativas/activas
 * @desc    Obtener cooperativas activas
 * @access  Public
 */
router.get('/activas', cooperativaController.getActive);

/**
 * @route   GET /api/cooperativas/:id
 * @desc    Obtener cooperativa por ID
 * @access  Public
 */
router.get('/:id', cooperativaValidation.getById, cooperativaController.getById);

/**
 * @route   POST /api/cooperativas
 * @desc    Crear nueva cooperativa
 * @access  Public
 */
router.post('/', cooperativaValidation.create, cooperativaController.create);

/**
 * @route   PUT /api/cooperativas/:id
 * @desc    Actualizar cooperativa
 * @access  Public
 */
router.put('/:id', cooperativaValidation.update, cooperativaController.update);

/**
 * @route   DELETE /api/cooperativas/:id
 * @desc    Eliminar cooperativa
 * @access  Public
 */
router.delete('/:id', cooperativaValidation.getById, cooperativaController.delete);

module.exports = router;
