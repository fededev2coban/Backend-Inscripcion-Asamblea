const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rolController');
const { rolValidation } = require('../middleware/validators/rolValidator');

/**
 * @route   GET /api/roles
 * @desc    Obtener todas las rol
 * @access  Public
 */
router.get('/', rolController.getAll);

/**
 * @route   GET /api/roles/activas
 * @desc    Obtener rol activas
 * @access  Public
 */
router.get('/activas', rolController.getActive);

/**
 * @route   GET /api/roles/:id
 * @desc    Obtener cooperativa por ID
 * @access  Public
 */
router.get('/:id', rolValidation.getById, rolController.getById);

/**
 * @route   POST /api/roles
 * @desc    Crear nueva cooperativa
 * @access  Public
 */
router.post('/', rolValidation.create, rolController.create);

/**
 * @route   PUT /api/roles/:id
 * @desc    Actualizar cooperativa
 * @access  Public
 */
router.put('/:id', rolValidation.update, rolController.update);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Eliminar cooperativa
 * @access  Public
 */
router.delete('/:id', rolValidation.getById, rolController.delete);

module.exports = router;
