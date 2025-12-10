// backend/src/db/seedAdmin.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'infoser_ep_spa',
  password: process.env.DB_PASSWORD || 'Falcon',
  port: process.env.DB_PORT || 5432,
});

(async () => {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@infoser.cl';
    const plain = process.env.ADMIN_PASSWORD || 'Infoser!2025#CCTV';
    const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const hash = await bcrypt.hash(plain, rounds);

    const sql = `
      INSERT INTO usuarios (email, password_hash, nombre, rol, telefono, activo)
      VALUES ($1, $2, $3, 'administrador', $4, true)
      ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            rol = 'administrador',
            activo = true,
            fecha_actualizacion = CURRENT_TIMESTAMP
      RETURNING id, email, nombre, rol, activo;
    `;
    const { rows } = await pool.query(sql, [email, hash, 'Administrador INFOSER', '+56 9 7719 6032']);
    console.log('Admin sembrado/actualizado:', rows[0]);
    process.exit(0);
  } catch (e) {
    console.error('Error seed admin:', e);
    process.exit(1);
  }
})();
