const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { getConnection, closeConnection } = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

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
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await getConnection();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api`);
      console.log('=================================');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGTERM', async () => {
  console.log('\n⏳ SIGTERM recibido. Cerrando servidor...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⏳ SIGINT recibido. Cerrando servidor...');
  await closeConnection();
  process.exit(0);
});

// Iniciar el servidor
startServer();

module.exports = app;
