// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/jwt');

/**
 * Verifica el header Authorization: Bearer <token>
 * y coloca el payload en req.user
 */
function verifyJWT(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token requerido' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET); // { id, rol, email, nombre }
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

/**
 * Permite pasar solo a ciertos roles
 * @param  {...string} rolesPermitidos
 */
function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ success: false, message: 'Sin permisos' });
    }
    next();
  };
}

module.exports = { verifyJWT, requireRole };
