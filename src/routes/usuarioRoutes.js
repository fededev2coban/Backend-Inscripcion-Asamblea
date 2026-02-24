const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { usuarioValidation } = require('../middleware/validators/usuarioValidator');

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios
 * @access  Private (requiere autenticación)
 */
router.get('/', usuarioController.getAll);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener usuario por ID
 * @access  Private
 */
router.get('/:id', usuarioValidation.getById, usuarioController.getById);

/**
 * @route   GET /api/usuarios/buscar/:username
 * @desc    Buscar usuario por nombre de usuario
 * @access  Private
 */
router.get('/buscar/:username', usuarioValidation.searchByUsername, usuarioController.searchByUsername);

/**
 * @route   GET /api/usuarios/rol/:id_rol
 * @desc    Obtener usuarios por rol
 * @access  Private
 */
router.get('/rol/:id_rol', usuarioValidation.getByRol, usuarioController.getByRol);

/**
 * @route   POST /api/usuarios
 * @desc    Crear nuevo usuario
 * @access  Private (solo administradores)
 */
router.post('/', usuarioValidation.create, usuarioController.create);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar usuario
 * @access  Private (solo administradores)
 */
router.put('/:id', usuarioValidation.update, usuarioController.update);

/**
 * @route   PATCH /api/usuarios/:id/estado
 * @desc    Activar/Desactivar usuario
 * @access  Private (solo administradores)
 */
router.patch('/:id/estado', usuarioValidation.toggleEstado, usuarioController.toggleEstado);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar usuario
 * @access  Private (solo administradores)
 */
router.delete('/:id', usuarioValidation.delete, usuarioController.delete);

module.exports = router;