const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const { eventoValidation } = require('../middleware/validators/eventoValidator');
const { authMiddleware } = require('../middleware/auth');

/**
 * @route   GET /api/eventos
 * @desc    Obtener todos los eventos
 * @access  Private
 */
router.get('/', authMiddleware, eventoController.getAll);

/**
 * @route   GET /api/eventos/activos
 * @desc    Obtener eventos activos
 * @access  Private
 */
router.get('/activos', authMiddleware, eventoController.getActive);

/**
 * @route   GET /api/eventos/proximos
 * @desc    Obtener eventos próximos
 * @access  Private
 */
router.get('/proximos', authMiddleware, eventoController.getUpcoming);

/**
 * @route   GET /api/eventos/:id
 * @desc    Obtener evento por ID
 * @access  Private
 */
router.get('/:id', authMiddleware, eventoValidation.getById, eventoController.getById);

/**
 * @route   POST /api/eventos
 * @desc    Crear nuevo evento
 * @access  Private
 */
router.post('/', authMiddleware, eventoValidation.create, eventoController.create);

/**
 * @route   POST /api/eventos/:id/publicar
 * @desc    Publicar evento y generar link público
 * @access  Private
 */
router.post('/:id/publicar', authMiddleware, eventoValidation.getById, eventoController.publish);

/**
 * @route   POST /api/eventos/:id/despublicar
 * @desc    Despublicar evento
 * @access  Private
 */
router.post('/:id/despublicar', authMiddleware, eventoValidation.getById, eventoController.unpublish);

/**
 * @route   PUT /api/eventos/:id
 * @desc    Actualizar evento
 * @access  Private
 */
router.put('/:id', authMiddleware, eventoValidation.update, eventoController.update);

/**
 * @route   DELETE /api/eventos/:id
 * @desc    Eliminar evento
 * @access  Private
 */
router.delete('/:id', authMiddleware, eventoValidation.getById, eventoController.delete);

module.exports = router;
