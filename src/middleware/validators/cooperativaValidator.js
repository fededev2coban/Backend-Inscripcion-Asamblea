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

const cooperativaValidation = {
  create: [
    body('name_cooperativa')
      .notEmpty().withMessage('El nombre de la cooperativa es requerido')
      .isLength({ max: 50 }).withMessage('El nombre no puede exceder 50 caracteres'),
    body('afiliado')
      .optional()
      .isInt({ min: 0, max: 1 }).withMessage('Afiliado debe ser 0 o 1'),
    body('estado')
      .optional()
      .isInt({ min: 0, max: 1 }).withMessage('Estado debe ser 0 o 1'),
    validate
  ],
  update: [
    param('id').isInt().withMessage('ID inválido'),
    body('name_cooperativa')
      .optional()
      .isLength({ max: 50 }).withMessage('El nombre no puede exceder 50 caracteres'),
    body('afiliado')
      .optional()
      .isInt({ min: 0, max: 1 }).withMessage('Afiliado debe ser 0 o 1'),
    body('estado')
      .optional()
      .isInt({ min: 0, max: 1 }).withMessage('Estado debe ser 0 o 1'),
    validate
  ],
  getById: [
    param('id').isInt().withMessage('ID inválido'),
    validate
  ]
};

module.exports = {
  cooperativaValidation
};
