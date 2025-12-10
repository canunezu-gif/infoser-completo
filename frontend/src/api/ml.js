// frontend/src/api/ml.js

// Base del backend (Express). Usa REACT_APP_API_URL si está definida.
// Ej: REACT_APP_API_URL=http://localhost:5000
// Fallback por defecto → backend en Render
const RAW =
  process.env.NODE_ENV === 'production'
    ? 'https://infoser-backend.onrender.com'
    : process.env.REACT_APP_API_URL || 'http://localhost:5000';
// normaliza: sin slash final
const API_BASE = RAW.replace(/\/$/, '');
// garantiza que termine en /api (evita /api/api)
const API = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

// JWT desde localStorage (ajusta la key si usas otra)
function getToken() {
  try {
    const raw = localStorage.getItem('token') || localStorage.getItem('jwt');
    return raw ? raw : null;
  } catch {
    return null;
  }
}

/**
 * @typedef {Object} HistoryItem
 * @property {string} date         // "YYYY-MM-DD"
 * @property {string} comuna       // p. ej. "santiago"
 * @property {string} tipo_servicio // "instalacion" | "reparacion" | ...
 * @property {number} count        // >= 0
 */

/**
 * @typedef {Object} ForecastRequest
 * @property {HistoryItem[]} history
 * @property {number} horizon_days // 1..30
 */

/**
 * Llama al endpoint del backend que reenvía al servicio ML.
 * POST /api/ml/forecast  (rol: administrador)
 * @param {ForecastRequest} body
 * @returns {Promise<any>}  // { success: true, daily_forecast, pair_forecast }
 */
export async function postForecast(body) {
  const token = getToken();

  const resp = await fetch(`${API}/ml/forecast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    // Intenta extraer mensaje del backend
    let msg = `HTTP ${resp.status}`;
    try {
      const j = await resp.json();
      if (j?.message) msg = j.message;
    } catch {
      // ignore
    }
    const err = new Error(msg);
    err.status = resp.status;
    throw err;
  }

  // El backend responde { success: true, ...data }
  return resp.json();
}

/**
 * Obtiene datos crudos de solicitudes para llenar la tabla de historial.
 * GET /api/metricas/raw-solicitudes
 * @param {string} rango // '7-dias' | '30-dias' | '90-dias' | 'este-año'
 */
export async function fetchRawData(rango = '30-dias') {
  const token = getToken();
  const params = new URLSearchParams({ rango });

  const resp = await fetch(`${API}/metricas/raw-solicitudes?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!resp.ok) {
    const err = new Error(`HTTP ${resp.status}`);
    err.status = resp.status;
    throw err;
  }

  // { rows: [...] }
  return resp.json();
}

export default { postForecast, fetchRawData };
