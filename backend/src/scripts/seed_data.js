const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const TIPOS = ['mantenimiento', 'reparacion', 'instalacion', 'asesoria'];
const COMUNAS = ['Santiago', 'Providencia', 'Las Condes', 'Maipu', 'La Florida', 'Puente Alto', 'Ñuñoa'];
const PRIORIDADES = ['alta', 'media', 'baja'];

async function seed() {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

    const poolConfig = process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false } // Necesario para Render desde fuera
        }
        : {
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'infoser_ep_spa',
            password: process.env.DB_PASSWORD || 'Falcon',
            port: process.env.DB_PORT || 5432,
        };

    const pool = new Pool(poolConfig);

    try {
        console.log('🌱 Iniciando sembrado de datos...');
        console.log(`🔌 Conectando a DB: ${process.env.DB_HOST || 'localhost'} como ${process.env.DB_USER || 'postgres'}`);

        // 1. Crear o buscar cliente de prueba
        const email = 'cliente_test_ml@infoser.cl';
        let clienteId;

        const resCliente = await pool.query('SELECT id FROM clientes WHERE email = $1', [email]);

        if (resCliente.rows.length > 0) {
            clienteId = resCliente.rows[0].id;
            console.log(`✅ Cliente de prueba encontrado (ID: ${clienteId})`);
        } else {
            const hash = await bcrypt.hash('123456', 10);
            const insertCliente = await pool.query(
                `INSERT INTO clientes (nombre, email, password_hash, telefono, activo)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id`,
                ['Cliente Test ML', email, hash, '+56900000000']
            );
            clienteId = insertCliente.rows[0].id;
            console.log(`✅ Cliente de prueba creado (ID: ${clienteId})`);
        }

        // 2. Generar 2000 solicitudes con patrones claros
        console.log('🚀 Generando 2000 solicitudes históricas con patrones...');

        const total = 2000;
        const batchSize = 100;
        let count = 0;

        for (let i = 0; i < total; i++) {
            const diasAtras = Math.floor(Math.random() * 180); // Últimos 6 meses
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - diasAtras);

            const mes = fecha.getMonth(); // 0-11
            const diaSemana = fecha.getDay(); // 0 (Domingo) - 6 (Sábado)

            // Lógica de patrones para que el ML tenga qué predecir:

            // A. Comunas "Heavy": Santiago y Maipu tienen el 50% del tráfico
            let comuna;
            const randComuna = Math.random();
            if (randComuna < 0.3) comuna = 'Santiago';
            else if (randComuna < 0.5) comuna = 'Maipu';
            else comuna = COMUNAS[Math.floor(Math.random() * COMUNAS.length)];

            // B. Patrón Semanal:
            // "Reparacion" ocurre más los Lunes (0) y Viernes (4).
            // "Instalacion" ocurre más los fines de semana (0 y 6).
            let tipo = TIPOS[Math.floor(Math.random() * TIPOS.length)];
            const randTipo = Math.random();

            if (diaSemana === 1 || diaSemana === 5) { // Lunes o Viernes
                if (randTipo < 0.6) tipo = 'reparacion';
            } else if (diaSemana === 0 || diaSemana === 6) { // Fin de semana
                if (randTipo < 0.7) tipo = 'instalacion';
            }

            // C. Estacionalidad Invierno (Meses 5,6,7): Aumenta Mantenimiento y Reparación
            if (mes >= 5 && mes <= 7) {
                if (Math.random() > 0.5) tipo = 'reparacion';
            }

            const prioridad = PRIORIDADES[Math.floor(Math.random() * PRIORIDADES.length)];

            await pool.query(
                `INSERT INTO solicitudes 
            (cliente_id, titulo, descripcion, direccion_servicio, comuna, region, tipo_servicio, prioridad, fecha_solicitud, estado_actual)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completada')`,
                [
                    clienteId,
                    `Solicitud histórica ${i + 1}`,
                    'Generada con patrones para ML',
                    'Calle Falsa 123',
                    comuna,
                    'Metropolitana',
                    tipo,
                    prioridad,
                    fecha
                ]
            );

            count++;
            if (count % batchSize === 0) {
                process.stdout.write(`.`);
            }
        }

        console.log(`\n✨ ¡Listo! Se insertaron ${count} solicitudes.`);

    } catch (err) {
        console.error('❌ Error:', err);
        throw err; // Re-lanzar para que el endpoint sepa que falló
    } finally {
        await pool.end();
    }
}

// Exportar la función para usarla en server.js
module.exports = { seed };

// Si se ejecuta directamente desde la terminal: node seed_data.js
if (require.main === module) {
    seed();
}
