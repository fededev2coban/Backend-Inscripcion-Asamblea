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

const rolValidation = {
  create: [
    body('rolname')
      .notEmpty().withMessage('El nombre del rol es requerido')
      .isLength({ max: 50 }).withMessage('El nombre no puede exceder 50 caracteres'),
    body('estado')
      .optional()
      .isInt({ min: 0, max: 1 }).withMessage('Estado debe ser 0 o 1'),
    validate
  ],
  update: [
    param('id').isInt().withMessage('ID inválido'),
    body('rolname')
      .optional()
      .isLength({ max: 50 }).withMessage('El nombre no puede exceder 50 caracteres'),
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
  rolValidation
};
