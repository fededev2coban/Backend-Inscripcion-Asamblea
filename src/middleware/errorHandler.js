const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Error de validación',
      details: err.message
    });
  }

  // Error de SQL
  if (err.name === 'RequestError') {
    return res.status(500).json({
      success: false,
      error: 'Error en la base de datos',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
};

module.exports = {
  errorHandler,
  notFound
};
