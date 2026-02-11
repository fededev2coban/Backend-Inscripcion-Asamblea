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

const eventoValidation = {
  create: [
    body('nombre_evento')
      .notEmpty().withMessage('El nombre del evento es requerido')
      .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
    body('estado_evento')
      .isInt({ min: 0, max: 1 }).withMessage('Estado debe ser 0 o 1'),
    body('fecha_evento')
      .notEmpty().withMessage('La fecha del evento es requerida')
      .isISO8601().withMessage('Formato de fecha inválido (use YYYY-MM-DD)'),
    body('lugar_evento')
      .notEmpty().withMessage('El lugar del evento es requerido')
      .isLength({ max: 100 }).withMessage('El lugar no puede exceder 100 caracteres'),
    body('hora_evento')
      .notEmpty().withMessage('La hora del evento es requerida')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Formato de hora inválido (use HH:MM o HH:MM:SS)'),
    validate
  ],
  update: [
    param('id').isInt().withMessage('ID inválido'),
    body('nombre_evento')
      .optional()
      .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
    body('estado_evento')
      .optional()
      .isInt({ min: 0, max: 1 }).withMessage('Estado debe ser 0 o 1'),
    body('fecha_evento')
      .optional()
      .isISO8601().withMessage('Formato de fecha inválido (use YYYY-MM-DD)'),
    body('lugar_evento')
      .optional()
      .isLength({ max: 100 }).withMessage('El lugar no puede exceder 100 caracteres'),
    body('hora_evento')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Formato de hora inválido (use HH:MM o HH:MM:SS)'),
    validate
  ],
  getById: [
    param('id').isInt().withMessage('ID inválido'),
    validate
  ]
};

module.exports = {
  eventoValidation
};
