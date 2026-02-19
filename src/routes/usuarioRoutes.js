const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { personaValidation } = require('../middleware/validators/personaValidator');

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todas las usuarios
 * @access  Public
 */
router.get('/', usuarioController.getAll);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener persona por ID
 * @access  Public
 */
router.get('/:id', personaValidation.getById, usuarioController.getById);

/**
 * @route   GET /api/usuarios/dpi/:dpi
 * @desc    Buscar persona por DPI
 * @access  Public
 */
router.get('/dpi/:dpi', usuarioController.searchByDpi);

/**
 * @route   GET /api/usuarios/cooperativa/:id_cooperativa
 * @desc    Obtener usuarios de una cooperativa
 * @access  Public
 */
router.get('/rol/:id_rol', usuarioController.getByRol);

/**
 * @route   POST /api/usuarios
 * @desc    Crear nueva persona
 * @access  Public
 */
router.post('/', personaValidation.create, usuarioController.create);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar persona
 * @access  Public
 */
router.put('/:id', personaValidation.update, usuarioController.update);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar persona
 * @access  Public
 */
router.delete('/:id', personaValidation.getById, usuarioController.delete);

module.exports = router;
