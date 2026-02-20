const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rutas
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Sistema de Inscripción a Eventos',
    version: '1.0.0',
    endpoints: {
      cooperativas: '/api/cooperativas',
      roles: '/api/roles',
      eventos: '/api/eventos',
      personas: '/api/personas',
      usuarios: '/api/usuarios',
      registros: '/api/registros',
      health: '/api/health'
    }
  });
});

app.use('/api', routes);

// Manejo de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║     🚀 SERVIDOR INICIADO - ASAMBLEA BACKEND V3 🚀            ║
  ║                                                              ║
  ║     Puerto: ${PORT}                                             ║
  ║     Entorno: ${process.env.NODE_ENV || 'development'}                                     ║
  ║     URL: http://localhost:${PORT}                               ║
  ║                                                              ║
  ║     📚 Documentación: /api/health                            ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
