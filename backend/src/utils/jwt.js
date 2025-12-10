// backend/src/utils/jwt.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Clave secreta para firmar JWT.
 * En producción DEBE venir de la variable de entorno JWT_SECRET
 * y ser una cadena larga y difícil (mínimo 32 caracteres).
 */
const JWT_SECRET = process.env.JWT_SECRET || 'DEV_SECRET_CAMBIA_ESTO_EN_PRODUCCION';

/**
 * Tiempo de expiración del token.
 * Ejemplos de formato: "1h", "2h", "7d".
 */
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

/**
 * Emite un token firmado con los datos mínimos del usuario.
 * @param {Object} payload - { id, email, rol, tipo, nombre }
 * @returns {string} token JWT
 */
function emitirToken(payload) {
  // Nunca meter cosas sensibles como password aquí
  const data = {
    id: payload.id,
    email: payload.email,
    rol: payload.rol,
    tipo: payload.tipo,
    nombre: payload.nombre,
  };

  return jwt.sign(data, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

module.exports = {
  emitirToken,
  JWT_SECRET,
  JWT_EXPIRES_IN,
};
