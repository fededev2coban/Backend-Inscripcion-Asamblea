const express = require('express');
const router = express.Router();
const registroPublicoController = require('../controllers/registroPublicoController');
const eventoController = require('../controllers/eventoController');
const { body } = require('express-validator');

const validate = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route   GET /api/public/evento/:link
 * @desc    Obtener información de evento público por link
 * @access  Public
 */
router.get('/evento/:link', eventoController.getByPublicLink);

/**
 * @route   GET /api/public/cooperativas
 * @desc    Obtener cooperativas activas para formulario público
 * @access  Public
 */
router.get('/cooperativas', registroPublicoController.getCooperativasActivas);

/**
 * @route   POST /api/public/registro/:link
 * @desc    Registrar persona a evento público
 * @access  Public
 */
router.post('/registro/:link', [
  body('nombres')
    .notEmpty().withMessage('Los nombres son requeridos')
    .isLength({ max: 50 }).withMessage('Los nombres no pueden exceder 50 caracteres'),
  body('apellidos')
    .notEmpty().withMessage('Los apellidos son requeridos')
    .isLength({ max: 50 }).withMessage('Los apellidos no pueden exceder 50 caracteres'),
  body('email')
    .optional()
    .isEmail().withMessage('Email inválido')
    .isLength({ max: 100 }).withMessage('El email no puede exceder 100 caracteres'),
  body('dpi')
    .notEmpty().withMessage('El DPI es requerido')
    .isInt().withMessage('El DPI debe ser un número entero'),
  body('telefono')
    .optional()
    .isInt().withMessage('El teléfono debe ser un número entero'),
  body('puesto')
    .notEmpty().withMessage('El puesto es requerido')
    .isLength({ max: 50 }).withMessage('El puesto no puede exceder 50 caracteres'),
  validate
], registroPublicoController.registrarEvento);

module.exports = router;
