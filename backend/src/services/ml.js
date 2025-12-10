// backend/src/services/ml.js
// Proxy al servicio de ML en Python (FastAPI)

// URL del servicio Python (siempre usar la URL pública de Render)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'https://infoser-ml-service.onrender.com';

/**
 * Helper para esperar un tiempo dado (ms)
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Reenvía la solicitud de pronóstico al microservicio de Python.
 * body: { history: [...], horizon_days: N }
 * Implementa reintentos para manejar errores 429 o transitorios.
 */
async function forecastML(body) {
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      console.log(`[ML Proxy] Enviando solicitud a ${ML_SERVICE_URL}/forecast (Intento ${attempt + 1}/${MAX_RETRIES})`);

      const response = await fetch(`${ML_SERVICE_URL}/forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', // Fake browser to bypass Cloudflare
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // Si es 429 (Too Many Requests) o 5xx, intentamos de nuevo
        if (response.status === 429 || response.status >= 500) {
          const text = await response.text();
          console.warn(`[ML Proxy] Error ${response.status}: ${text}. Reintentando...`);
          attempt++;
          if (attempt < MAX_RETRIES) {
            // Backoff exponencial: 1s, 2s, 4s...
            await wait(1000 * Math.pow(2, attempt - 1));
            continue;
          } else {
            throw new Error(`ML Service Error (${response.status}): ${text}`);
          }
        }

        // Otros errores (400, 401, etc.) no se reintentan
        const text = await response.text();
        throw new Error(`ML Service Error (${response.status}): ${text}`);
      }

      const data = await response.json();
      return data; // { daily_forecast, pair_forecast }

    } catch (error) {
      console.error(`[ML Proxy] Error conectando con servicio Python en ${ML_SERVICE_URL} (Intento ${attempt + 1}):`, error);

      // Si falla la conexión (ECONNREFUSED), lanzamos error claro sin reintentar (o podríamos reintentar si es flaky)
      if (error.cause && error.cause.code === 'ECONNREFUSED') {
        throw new Error(`El servicio de ML (Python) no está disponible en ${ML_SERVICE_URL}. Asegúrate de que esté corriendo.`);
      }

      attempt++;
      if (attempt >= MAX_RETRIES) {
        throw new Error(`Fallo final conectando a ML Service: ${error.message}`);
      }
      await wait(1000 * Math.pow(2, attempt - 1));
    }
  }
}

module.exports = { forecastML };
