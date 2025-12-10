const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'infoser_db',
  password: process.env.DB_PASSWORD || 'tu_password',
  port: process.env.DB_PORT || 5432,
  // Opciones adicionales para mejor rendimiento
  max: 20, // máximo de clientes en el pool
  idleTimeoutMillis: 30000, // tiempo máximo que un cliente puede estar idle
  connectionTimeoutMillis: 2000, // tiempo máximo para conectar
});

// Verificar conexión al inicializar
pool.on('connect', () => {
  console.log('✅ Conectado a la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
});

// Función para probar la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL verificada correctamente');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error.message);
    return false;
  }
};

// Función para ejecutar consultas con manejo de errores
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Query ejecutada en ${duration}ms:`, text.substring(0, 100) + '...');
    return res;
  } catch (error) {
    console.error('❌ Error en query:', error.message);
    console.error('Query:', text);
    console.error('Parámetros:', params);
    throw error;
  }
};

// Función para obtener un cliente del pool (para transacciones)
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  // Establecer un timeout para el cliente
  const timeout = setTimeout(() => {
    console.error('❌ Un cliente ha estado inactivo por más de 30 segundos');
  }, 30000);

  // Monkey patch el método query para rastrear las consultas
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };

  client.release = () => {
    // Limpiar el timeout
    clearTimeout(timeout);
    // Restablecer el método query
    client.query = query;
    // Liberar el cliente
    release.apply(client);
  };

  return client;
};

// Función para iniciar una transacción
const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Exportar las funciones
module.exports = {
  pool,
  query,
  getClient,
  transaction,
  testConnection
};