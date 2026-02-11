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

const registroEventoValidation = {
  create: [
    body('id_evento')
      .notEmpty().withMessage('El ID del evento es requerido')
      .isInt().withMessage('ID de evento inválido'),
    body('id_persona')
      .notEmpty().withMessage('El ID de la persona es requerido')
      .isInt().withMessage('ID de persona inválido'),
    validate
  ],
  getById: [
    param('id').isInt().withMessage('ID inválido'),
    validate
  ],
  getByEvento: [
    param('id_evento').isInt().withMessage('ID de evento inválido'),
    validate
  ],
  getByPersona: [
    param('id_persona').isInt().withMessage('ID de persona inválido'),
    validate
  ]
};

module.exports = {
  registroEventoValidation
};
