const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'Asamblea3',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.connect()
  .then(client => {
    console.log('✅ Conectado a PostgreSQL al iniciar');
    client.release(); // liberar cliente
  })
  .catch(err => {
    console.error('❌ Error al conectar a PostgreSQL:', err);
  });


pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL:', err);
  process.exit(-1);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // console.log('Query ejecutada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en query:', error.message);
    console.error('SQL:', text);
    console.error('Params:', params);
    throw error;
  }
};

const getClient = async () => {
  const client = await pool.connect();
  return client;
};

module.exports = {
  query,
  pool,
  getClient
};
