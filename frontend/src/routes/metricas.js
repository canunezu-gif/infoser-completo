// backend/src/routes/metricas.js
const express = require('express');
const router = express.Router();

// ajusta estas rutas si tus helpers están en otros paths
const { requireAuth, requireRole } = require('../middleware/auth');
const pool = require('../db/database'); // debe exportar un pool de pg

// Devuelve filas mínimas para filtrar en el front (sin PII)
router.get('/metricas/raw-solicitudes', requireAuth, requireRole('administrador'), async (req, res, next) => {
  try {
    const { rango = '30-dias' } = req.query;

    const days =
      rango === '7-dias' ? 7 :
      rango === '90-dias' ? 90 :
      rango === 'este-año' ? 365 : 30;

    const sql = `
      SELECT
        id,
        fecha_solicitud::date AS fecha,
        LOWER(COALESCE(comuna,'')) AS comuna,
        COALESCE(tipo_servicio,'') AS tipo_servicio,
        estado_actual AS estado,
        tecnico_id
      FROM solicitudes
      WHERE fecha_solicitud >= NOW() - INTERVAL '${days} days'
      ORDER BY fecha_solicitud DESC
      LIMIT 50000;
    `;

    const { rows } = await pool.query(sql);
    res.json({ rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
