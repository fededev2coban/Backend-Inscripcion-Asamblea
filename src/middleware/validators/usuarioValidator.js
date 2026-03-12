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

const usuarioValidation = {
  // Validación para crear usuario
  create: [
    body('username')
      .notEmpty().withMessage('El nombre de usuario es requerido')
      .isLength({ min: 3, max: 50 }).withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('El nombre de usuario solo puede contener letras, números y guión bajo'),
    
    body('password')
      .notEmpty().withMessage('La contraseña es requerida')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    
    body('nombre_completo')
      .notEmpty().withMessage('El nombre completo es requerido')
      .isLength({ max: 100 }).withMessage('El nombre completo no puede exceder 100 caracteres'),
    
    body('id_rol')
      .notEmpty().withMessage('El rol es requerido')
      .isInt({ min: 1 }).withMessage('ID de rol inválido'),
    
    body('estado')
      .optional()
      .isIn([0, 1]).withMessage('Estado inválido. Debe ser 0 o 1'),
    
    validate
  ],

  // Validación para actualizar usuario
  update: [
    param('id')
      .isInt({ min: 1 }).withMessage('ID de usuario inválido'),
    
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 }).withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('El nombre de usuario solo puede contener letras, números y guión bajo'),
    
    body('password')
      .optional()
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    
    body('nombre_completo')
      .optional()
      .isLength({ max: 100 }).withMessage('El nombre completo no puede exceder 100 caracteres'),
    
    body('id_rol')
      .optional()
      .isInt({ min: 1 }).withMessage('ID de rol inválido'),
    
    body('estado')
      .optional()
      .isIn([0, 1]).withMessage('Estado inválido. Debe ser 0 o 1'),
    
    validate
  ],

  // Validación para obtener usuario por ID
  getById: [
    param('id')
      .isInt({ min: 1 }).withMessage('ID de usuario inválido'),
    validate
  ],

  // Validación para buscar por username
  searchByUsername: [
    param('username')
      .notEmpty().withMessage('El nombre de usuario es requerido')
      .isLength({ min: 1, max: 50 }).withMessage('Nombre de usuario inválido'),
    validate
  ],

  // Validación para obtener usuarios por rol
  getByRol: [
    param('id_rol')
      .isInt({ min: 1 }).withMessage('ID de rol inválido'),
    validate
  ],

  // Validación para cambiar estado
  toggleEstado: [
    param('id')
      .isInt({ min: 1 }).withMessage('ID de usuario inválido'),
    
    body('estado')
      .notEmpty().withMessage('El estado es requerido')
      .isIn([0, 1]).withMessage('Estado inválido. Debe ser 0 o 1'),
    
    validate
  ],

  // Validación para eliminar usuario
  delete: [
    param('id')
      .isInt({ min: 1 }).withMessage('ID de usuario inválido'),
    validate
  ]
};

module.exports = {
  usuarioValidation
};