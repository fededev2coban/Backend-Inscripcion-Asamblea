const { body, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

const personaValidation = {
  create: [
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
    body('id_cooperativa')
      .optional()
      .isInt().withMessage('ID de cooperativa inválido'),
    body('institucion')
      .optional()
      .isLength({ max: 100 }).withMessage('La institución no puede exceder 100 caracteres'),
    body('puesto')
      .notEmpty().withMessage('El puesto es requerido')
      .isLength({ max: 50 }).withMessage('El puesto no puede exceder 50 caracteres'),
    validate
  ],
  update: [
    param('id').isInt().withMessage('ID inválido'),
    body('nombres')
      .optional()
      .isLength({ max: 50 }).withMessage('Los nombres no pueden exceder 50 caracteres'),
    body('apellidos')
      .optional()
      .isLength({ max: 50 }).withMessage('Los apellidos no pueden exceder 50 caracteres'),
    body('email')
      .optional()
      .isEmail().withMessage('Email inválido')
      .isLength({ max: 100 }).withMessage('El email no puede exceder 100 caracteres'),
    body('dpi')
      .optional()
      .isInt().withMessage('El DPI debe ser un número entero'),
    body('telefono')
      .optional()
      .isInt().withMessage('El teléfono debe ser un número entero'),
    body('id_cooperativa')
      .optional()
      .isInt().withMessage('ID de cooperativa inválido'),
    body('institucion')
      .optional()
      .isLength({ max: 100 }).withMessage('La institución no puede exceder 100 caracteres'),
    body('puesto')
      .optional()
      .isLength({ max: 50 }).withMessage('El puesto no puede exceder 50 caracteres'),
    validate
  ],
  getById: [
    param('id').isInt().withMessage('ID inválido'),
    validate
  ]
};

module.exports = {
  personaValidation
};
